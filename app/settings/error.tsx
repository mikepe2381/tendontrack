"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load settings."
      description="Try again — your settings haven't changed."
      error={error}
      reset={reset}
    />
  );
}
