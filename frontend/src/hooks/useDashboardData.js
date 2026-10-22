import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

const POLL_INTERVAL_MS = 15000;

export function useDashboardData(range, enabled = true) {
  const [data, setData] = useState({ latest: null, history: [], alerts: [] });
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: null,
    stale: false,
    lastUpdated: null
  });
  const requestInFlight = useRef(false);
  const hasLatestReading = useRef(false);

  const sync = useCallback(async (initial = false) => {
    if (!enabled) return;
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setState((current) => ({
      ...current,
      loading: initial && !hasLatestReading.current,
      refreshing: !initial,
      error: null
    }));

    try {
      const [latest, history, alerts] = await Promise.all([
        api.getLatest(),
        api.getHistory(range),
        api.getAlerts()
      ]);
      setData({ latest, history: history.points, alerts: alerts.alerts });
      hasLatestReading.current = true;
      setState({
        loading: false,
        refreshing: false,
        error: null,
        stale: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error.message,
        stale: hasLatestReading.current
      }));
    } finally {
      requestInFlight.current = false;
    }
  }, [enabled, range]);

  useEffect(() => {
    if (!enabled) return undefined;
    sync(true);
    const interval = window.setInterval(() => sync(false), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [enabled, sync]);

  return { ...data, ...state, sync: () => sync(false) };
}
