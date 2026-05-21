"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function TimelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load your timeline."
      description="We hit an error pulling your milestones. Try again — your saved data is unaffected."
      error={error}
      reset={reset}
    />
  );
}
