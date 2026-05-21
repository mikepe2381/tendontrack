import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getMilestoneTemplates } from "@/lib/clinical-content";
import type { TreatmentType } from "@/lib/schemas/profile";

// Idempotent re-seed. Safe to run any number of times for the same user.
//
// The payload deliberately contains ONLY user_id, milestone_key, and the
// expected_week_{min,max} columns. Supabase upsert maps to
// `INSERT ... ON CONFLICT DO UPDATE SET col=EXCLUDED.col` for every column in
// the payload — so columns we omit here (achieved_date, notes) are left
// untouched on existing rows. That lets us:
//   - insert new milestones when the clinical library grows
//   - update expected_week_min/max if the library tightens a range
//   - never clobber a milestone the user has already marked achieved or annotated
export async function seedMilestonesForUser(
  supabase: SupabaseClient,
  userId: string,
  pathway: TreatmentType,
): Promise<void> {
  const templates = getMilestoneTemplates(pathway);
  if (templates.length === 0) return;

  const rows = templates.map((t) => ({
    user_id: userId,
    milestone_key: t.key,
    expected_week_min: t.expected_week_min,
    expected_week_max: t.expected_week_max,
  }));

  const { error } = await supabase
    .from("milestones")
    .upsert(rows, { onConflict: "user_id,milestone_key" });

  if (error) throw error;
}
