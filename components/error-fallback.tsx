"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorFallbackProps = {
  title?: string;
  description?: string;
  error?: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
};

export function ErrorFallback({
  title = "Something went sideways.",
  description = "We hit an unexpected error loading this page. The error has been logged — give it another shot.",
  error,
  reset,
  homeHref = "/dashboard",
}: ErrorFallbackProps) {
  return (
    <div className="container max-w-md py-16">
      <div className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
          />
          <div className="space-y-1">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
            {error?.digest ? (
              <p className="text-xs text-muted-foreground">
                Reference: <span className="font-mono">{error.digest}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="ghost">
            <Link href={homeHref}>Back to dashboard</Link>
          </Button>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
