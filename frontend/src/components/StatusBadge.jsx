const labels = {
  safe: 'Safe',
  warning: 'Warning',
  unsafe: 'Unsafe'
};

export function StatusBadge({ status = 'safe', temperature = false }) {
  const className = {
    safe: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    unsafe: 'bg-red-50 text-red-600'
  }[status] ?? 'bg-slate-100 text-slate-600';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {temperature && status === 'safe' ? 'Normal' : labels[status] ?? 'Unknown'}
    </span>
  );
}
