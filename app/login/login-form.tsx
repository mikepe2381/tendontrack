"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getRedirectURL(next?: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const url = new URL("/auth/callback", origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

export function LoginForm({
  next,
  error,
  sent,
}: {
  next?: string;
  error?: string;
  sent: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(
    sent ? "Check your email for a magic link." : null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(error ?? null);
  const [pending, startTransition] = useTransition();

  const supabase = createClient();

  function handleGoogle() {
    setErrorMsg(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getRedirectURL(next) },
      });
      if (error) setErrorMsg(error.message);
    });
  }

  function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectURL(next),
          shouldCreateUser: true,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setMessage("Check your email for a magic link.");
        router.replace(
          `/login?sent=1${next ? `&next=${encodeURIComponent(next)}` : ""}`,
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={pending}
      >
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending || !email}>
          {pending ? "Sending…" : "Send magic link"}
        </Button>
      </form>

      {message ? (
        <p
          role="status"
          className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
        >
          {message}
        </p>
      ) : null}
      {errorMsg ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMsg}
        </p>
      ) : null}
    </div>
  );
}
