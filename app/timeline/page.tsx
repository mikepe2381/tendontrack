import { ClinicalDisclaimer } from "@/components/clinical-disclaimer";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import { seedMilestonesForUser } from "@/lib/milestones/seed";
import {
  getMilestoneTemplates,
  type MilestoneTemplate,
} from "@/lib/clinical-content";
import { weeksSince } from "@/lib/dates";

import { TimelineView, type TimelineMilestone } from "./timeline-view";

type MilestoneRow = {
  milestone_key: string;
  expected_week_min: number | null;
  expected_week_max: number | null;
  achieved_date: string | null;
  notes: string | null;
};

export default async function TimelinePage() {
  const { supabase, user, profile } = await requireOnboardedProfile();

  // Auto-backfill: keep this user's milestone rows in sync with the current
  // clinical library. Cheap, idempotent, and avoids forcing existing users
  // to re-run onboarding to get newly-added milestones.
  try {
    await seedMilestonesForUser(supabase, user.id, profile.treatment_type);
  } catch {
    // Non-fatal: if seeding fails, we still try to render whatever is in the
    // DB. The settings page exposes a manual re-seed action as a fallback.
  }

  const { data: rows } = await supabase
    .from("milestones")
    .select("milestone_key, expected_week_min, expected_week_max, achieved_date, notes")
    .eq("user_id", user.id)
    .returns<MilestoneRow[]>();

  const templates = getMilestoneTemplates(profile.treatment_type);
  const byKey = new Map<string, MilestoneRow>(
    (rows ?? []).map((r) => [r.milestone_key, r]),
  );

  const milestones: TimelineMilestone[] = templates
    .map((t: MilestoneTemplate) => {
      const row = byKey.get(t.key);
      return {
        key: t.key,
        label: t.label,
        phase: t.phase,
        // Prefer the live library values — they may be more current than the
        // row, which is what re-seeding is for. Falls back to row if absent.
        expected_week_min: t.expected_week_min ?? row?.expected_week_min ?? 0,
        expected_week_max: t.expected_week_max ?? row?.expected_week_max ?? 0,
        what_to_expect: t.what_to_expect,
        source: t.source,
        evidence_level: t.evidence_level,
        achieved_date: row?.achieved_date ?? null,
        notes: row?.notes ?? null,
      } satisfies TimelineMilestone;
    })
    .sort((a, b) => a.expected_week_min - b.expected_week_min);

  const tz = profile.timezone || "UTC";
  const anchorDate =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? profile.surgery_date
      : profile.injury_date;
  const anchorLabel =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? "since surgery"
      : "since injury";
  const currentWeek = weeksSince(anchorDate, tz);

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Recovery</p>
        <h1 className="text-3xl font-semibold tracking-tight">Timeline</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;re currently at week {currentWeek} {anchorLabel}. Tap any
          milestone to see what to expect and mark it achieved.
        </p>
      </header>

      <ClinicalDisclaimer />

      <TimelineView
        milestones={milestones}
        currentWeek={currentWeek}
        anchorLabel={anchorLabel}
      />
    </div>
  );
}
