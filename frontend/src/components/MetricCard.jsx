import { StatusBadge } from './StatusBadge.jsx';

export function MetricCard({ icon, label, value, unit, status, rule, temperature }) {
  return (
    <article className="panel">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-3xl" aria-hidden="true">{icon}</span>
        <StatusBadge status={status} temperature={temperature} />
      </div>
      <p className="text-4xl font-bold tracking-tight text-ink">
        {value ?? '—'} <span className="text-base font-medium text-muted">{unit}</span>
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-muted">{rule}</p>
    </article>
  );
}
