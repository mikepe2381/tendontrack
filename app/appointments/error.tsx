"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function AppointmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load your appointments."
      description="Try again — your records are intact."
      error={error}
      reset={reset}
    />
  );
}
