"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load your dashboard."
      description="We hit an error pulling your data. Try again — if this keeps happening, sign out and back in."
      error={error}
      reset={reset}
    />
  );
}
