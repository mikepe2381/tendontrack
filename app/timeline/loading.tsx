export default function TimelineLoading() {
  return (
    <div className="container max-w-5xl space-y-6 py-8" aria-hidden>
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted/70" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="h-16 animate-pulse rounded-md border border-border bg-muted/40" />
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-md bg-muted/60"
              style={{ width: `${30 + ((i * 13) % 60)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
