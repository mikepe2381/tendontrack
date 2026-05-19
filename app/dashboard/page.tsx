import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="container max-w-3xl space-y-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{user?.email}</span>.
      </p>
      <p className="text-sm text-muted-foreground">
        Onboarding, daily log, timeline, and appointments arrive in the next
        milestones.
      </p>
    </div>
  );
}
