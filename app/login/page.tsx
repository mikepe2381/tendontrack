import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/app/login/login-form";

type SearchParams = Promise<{ next?: string; error?: string; sent?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  const { next, error, sent } = await searchParams;

  return (
    <div className="container flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use Google or get a magic link by email.
          </p>
        </div>
        <LoginForm next={next} error={error} sent={sent === "1"} />
      </div>
    </div>
  );
}
