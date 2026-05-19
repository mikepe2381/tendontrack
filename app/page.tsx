import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="container flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Track your Achilles recovery, honestly.
        </h1>
        <p className="mx-auto max-w-prose text-balance text-muted-foreground">
          A calm, evidence-based companion for the months after an Achilles
          tendon injury. Log daily, see where you stand against typical
          ranges, and walk into appointments prepared.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/login">Get started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/about">Learn more</Link>
        </Button>
      </div>
      <p className="max-w-prose text-xs text-muted-foreground">
        Educational content, not medical advice. Recovery varies widely.
      </p>
    </div>
  );
}
