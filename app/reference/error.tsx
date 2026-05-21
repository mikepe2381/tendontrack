"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function ReferenceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load the reference."
      description="Try again. The clinical content lives in source so it's always available — this is a transient render issue."
      error={error}
      reset={reset}
    />
  );
}
