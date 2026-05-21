export default function DashboardLoading() {
  return (
    <div className="container max-w-3xl space-y-6 py-10" aria-hidden>
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted/70" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex gap-2 pt-2">
          <div className="h-11 w-32 animate-pulse rounded bg-muted" />
          <div className="h-11 w-32 animate-pulse rounded bg-muted/60" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted/70" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
        <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}
