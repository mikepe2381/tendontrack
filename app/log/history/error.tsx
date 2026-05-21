"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function LogHistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load log history."
      description="Try again — your logs are safe."
      error={error}
      reset={reset}
    />
  );
}
