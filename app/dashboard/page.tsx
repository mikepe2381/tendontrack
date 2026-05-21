import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import { todayInTimezone, weeksSince } from "@/lib/dates";

const TREATMENT_LABEL: Record<string, string> = {
  surgical: "Surgical repair",
  non_surgical: "Non-surgical (conservative)",
};

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireOnboardedProfile();

  const timezone = profile.timezone || "UTC";
  const anchorDate =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? profile.surgery_date
      : profile.injury_date;
  const anchorLabel =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? "since surgery"
      : "since injury";
  const week = weeksSince(anchorDate, timezone);
  const displayName = profile.display_name?.trim() || user.email;

  const today = todayInTimezone(timezone);
  const { data: todaysLog } = await supabase
    .from("daily_logs")
    .select("log_date")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle<{ log_date: string }>();
  const hasLoggedToday = Boolean(todaysLog);

  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {displayName}
        </h1>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Daily check-in
        </p>
        <p className="mt-1 text-lg font-medium">
          {hasLoggedToday
            ? "You've logged today. Edit if anything's changed."
            : "How are you feeling today?"}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/log">
              {hasLoggedToday ? "Edit today's log" : "Log today"}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/log/history">View history</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Current week
          </p>
          <p className="mt-1 text-2xl font-semibold">Week {week}</p>
          <p className="mt-1 text-sm text-muted-foreground">{anchorLabel}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Treatment
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {TREATMENT_LABEL[profile.treatment_type] ?? profile.treatment_type}
          </p>
          {profile.affected_side ? (
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {profile.affected_side} side
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/timeline"
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Recovery
          </p>
          <p className="mt-1 text-lg font-medium">Timeline</p>
          <p className="mt-1 text-sm text-muted-foreground">
            See what&apos;s typical around week {week}.
          </p>
        </Link>
        <Link
          href="/reference/supplements"
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Reference
          </p>
          <p className="mt-1 text-lg font-medium">Supplement evidence</p>
          <p className="mt-1 text-sm text-muted-foreground">
            What the research actually says.
          </p>
        </Link>
      </section>

      <section className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Appointments and notes land in upcoming milestones.
      </section>
    </div>
  );
}
