export function AlertsFeed({ alerts }) {
  return (
    <section className="panel">
      <h2 className="mb-4 text-xl font-bold text-ink">Recent alerts</h2>
      {alerts.length ? (
        <div className="divide-y divide-slate-100">
          {alerts.map((alert, index) => (
            <div className="flex items-center gap-3 py-3" key={`${alert.created_at}-${index}`}>
              <span aria-hidden="true">{alert.severity === 'unsafe' ? '🔴' : '🟡'}</span>
              <p className="flex-1 text-sm text-ink">{alert.message}</p>
              <time className="text-xs text-muted" dateTime={alert.created_at}>
                {new Date(alert.created_at).toLocaleTimeString()}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No alerts — water quality is good.</p>
      )}
    </section>
  );
}
