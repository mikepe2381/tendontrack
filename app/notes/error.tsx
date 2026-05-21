"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function NotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load your notes."
      description="Try again — your notes are safe; only this view failed to render."
      error={error}
      reset={reset}
    />
  );
}
