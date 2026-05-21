"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function LogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load the daily log."
      description="Try again — any previously saved log entries are safe."
      error={error}
      reset={reset}
    />
  );
}
