import { useEffect, useState } from 'react';
import { AuthPage } from './components/AuthPage.jsx';
import { DeviceSetup } from './components/DeviceSetup.jsx';
import { api } from './services/api.js';
import { AlertsFeed } from './components/AlertsFeed.jsx';
import { AnalyticsCharts } from './components/AnalyticsCharts.jsx';
import { LiveStatus } from './components/LiveStatus.jsx';
import { MetricCard } from './components/MetricCard.jsx';
import { useDashboardData } from './hooks/useDashboardData.js';

function formatValue(value, digits = 1) {
  return typeof value === 'number' ? value.toFixed(digits) : null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [exportState, setExportState] = useState({ loading: false, error: null });
  const [range, setRange] = useState('1h');
  const dashboard = useDashboardData(range, Boolean(user));
  const reading = dashboard.latest;
  const activeDevice = devices[0];

  useEffect(() => {
    api.me().then((result) => setUser(result.user)).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    setDeviceLoading(true);
    api.getDevices()
      .then((result) => setDevices(result.devices))
      .catch((error) => setDeviceError(error.message))
      .finally(() => setDeviceLoading(false));
  }, [user]);

  async function authenticate(email, password) {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const result = authMode === 'register'
        ? await api.register(email, password)
        : await api.login(email, password);
      setUser(result.user);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }

  }

  async function exportReadings() {
    setExportState({ loading: true, error: null });
    try {
      const { blob, filename } = await api.exportReadings(activeDevice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportState({ loading: false, error: null });
    } catch (error) {
      setExportState({ loading: false, error: error.message });
    }
  }

  if (authLoading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your session…</div>;
  if (!user) return <AuthPage mode={authMode} onSubmit={authenticate} error={authError} loading={authLoading} onModeChange={setAuthMode} />;
  if (deviceLoading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your devices…</div>;
  if (!devices.length) {
    return (
      <DeviceSetup
        error={deviceError}
        loading={deviceLoading}
        onCreate={async (name, channelId) => {
          setDeviceError(null);
          setDeviceLoading(true);
          try {
            const result = await api.createDevice(name, channelId);
            setDevices([result.device]);
          } catch (error) {
            setDeviceError(error.message);
          } finally {
            setDeviceLoading(false);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-100 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-cyan-400 text-xl">💧</div>
            <span className="text-xl font-bold text-ink">DrinkSafe</span>
          </div>
          <LiveStatus stale={dashboard.stale} lastUpdated={dashboard.lastUpdated} refreshing={dashboard.refreshing} />
          <button className="text-sm text-muted underline" onClick={async () => { await api.logout(); setUser(null); }} type="button">Sign out</button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-5 py-10">
        <section className="text-center">
          <h1 className="bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-4xl font-bold text-transparent">
            Water quality monitor
          </h1>
          <p className="mt-2 text-muted">Real-time TDS, temperature, and quality score from your sensor</p>
        </section>

        {dashboard.error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
            <span>{dashboard.stale ? `Showing the last successful reading. ${dashboard.error}` : dashboard.error}</span>
            <button className="font-semibold underline" onClick={dashboard.sync} type="button">Retry</button>
          </div>
        )}

        {dashboard.loading && !reading ? (
          <div className="panel py-16 text-center text-sm text-muted">Connecting to the sensor service…</div>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-3">
              <MetricCard icon="💧" label="TDS level" value={formatValue(reading?.tds_ppm)} unit="ppm" status={reading?.tds_status} rule="WHO limit: < 500 ppm" />
              <MetricCard icon="🌡️" label="Water temperature" value={formatValue(reading?.temperature_c)} unit="°C" status={reading?.temp_status} temperature rule="Ideal range: 10–25 °C" />
              <MetricCard icon="🧪" label="Water quality score" value={formatValue(reading?.water_quality, 0)} unit="/100" status={reading?.wq_status} rule="Safe: > 75 · Warning: 51–75 · Unsafe: ≤ 50" />
            </section>
            <AnalyticsCharts points={dashboard.history} range={range} onRangeChange={setRange} />
            <div className="flex justify-end">
              <div className="flex flex-wrap justify-end gap-3">
                <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand disabled:cursor-wait disabled:opacity-60" disabled={exportState.loading || !activeDevice} onClick={exportReadings} type="button">
                  {exportState.loading ? 'Preparing CSV…' : 'Export CSV'}
                </button>
                <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60" disabled={dashboard.refreshing} onClick={dashboard.sync} type="button">
                  {dashboard.refreshing ? 'Syncing…' : 'Sync sensor'}
                </button>
              </div>
            </div>
            {exportState.error && (
              <p className="text-right text-sm text-red-700" role="alert">{exportState.error}</p>
            )}
            <AlertsFeed alerts={dashboard.alerts} />
          </>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-muted">DrinkSafe — University Final Year Project</footer>
    </div>
  );
}
