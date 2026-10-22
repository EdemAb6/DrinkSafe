export function LiveStatus({ stale, lastUpdated, refreshing }) {
  const label = stale ? 'STALE DATA' : refreshing ? 'SYNCING' : 'LIVE';
  const dotClass = stale ? 'bg-amber-500' : refreshing ? 'bg-brand' : 'bg-mint';

  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-muted">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      {label}
      <span className="hidden font-normal sm:inline">
        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for data'}
      </span>
    </div>
  );
}
