export default function LogLoading() {
  return (
    <div className="container max-w-2xl space-y-6 py-8" aria-hidden>
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted/70" />
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/70" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
