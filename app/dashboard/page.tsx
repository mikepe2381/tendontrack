import { requireOnboardedProfile } from "@/lib/auth/gates";
import { weeksSince } from "@/lib/dates";

const TREATMENT_LABEL: Record<string, string> = {
  surgical: "Surgical repair",
  non_surgical: "Non-surgical (conservative)",
};

export default async function DashboardPage() {
  const { user, profile } = await requireOnboardedProfile();

  const anchorDate =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? profile.surgery_date
      : profile.injury_date;
  const anchorLabel =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? "since surgery"
      : "since injury";
  const week = weeksSince(anchorDate, profile.timezone || "UTC");
  const displayName = profile.display_name?.trim() || user.email;

  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {displayName}
        </h1>
      </header>

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

      <section className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Daily log, timeline, and appointments land in upcoming milestones.
      </section>
    </div>
  );
}
