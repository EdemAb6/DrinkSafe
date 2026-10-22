import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false, grid: { color: '#eef2f7' } } }
  };
}

function MetricChart({ title, label, points, valueKey, statusKey }) {
  const chart = {
    labels: points.map((point) => point.label),
    datasets: [{
      label,
      data: points.map((point) => point[valueKey]),
      backgroundColor: points.map((point) => ({
        safe: '#1a56ff',
        warning: '#f59e0b',
        unsafe: '#ef4444'
      }[point[statusKey]] ?? '#1a56ff'))
    }]
  };

  return (
    <article className="panel">
      <h3 className="mb-4 font-semibold text-ink">{title}</h3>
      <div className="h-52">
        {points.length ? (
          <Bar data={chart} options={chartOptions()} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No readings for this range.
          </div>
        )}
      </div>
    </article>
  );
}

export function AnalyticsCharts({ points, range, onRangeChange }) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Performance analytics</h2>
        <div className="flex gap-2" role="tablist" aria-label="Chart time range">
          {['1h', '6h', '24h'].map((option) => (
            <button
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                option === range
                  ? 'border-brand bg-brand text-white'
                  : 'border-slate-200 bg-white text-muted hover:border-brand'
              }`}
              key={option}
              onClick={() => onRangeChange(option)}
              role="tab"
              aria-selected={option === range}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <MetricChart title="TDS level trend" label="TDS (ppm)" points={points} valueKey="tds_ppm" statusKey="tds_status" />
        <MetricChart title="Temperature trend" label="Temperature (°C)" points={points} valueKey="temperature_c" statusKey="temp_status" />
        <MetricChart title="Water quality trend" label="Score" points={points} valueKey="water_quality" statusKey="wq_status" />
      </div>
    </section>
  );
}
