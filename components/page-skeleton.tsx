import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  // Title is rendered as a tall solid block; subtitle and rows are dimmer.
  // Counts roughly match list-page layouts so the swap doesn't shift content.
  className?: string;
  rows?: number;
  showSubtitle?: boolean;
  containerWidth?: "narrow" | "default" | "wide";
};

const WIDTH_CLASSES = {
  narrow: "max-w-2xl",
  default: "max-w-3xl",
  wide: "max-w-5xl",
} as const;

export function PageSkeleton({
  className,
  rows = 4,
  showSubtitle = true,
  containerWidth = "default",
}: PageSkeletonProps) {
  return (
    <div
      className={cn(
        "container space-y-6 py-8",
        WIDTH_CLASSES[containerWidth],
        className,
      )}
      aria-hidden
    >
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {showSubtitle ? (
          <div className="h-4 w-72 animate-pulse rounded bg-muted/70" />
        ) : null}
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-muted/70" />
          </li>
        ))}
      </ul>
    </div>
  );
}
