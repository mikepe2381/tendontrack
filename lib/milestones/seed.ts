import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getMilestoneTemplates } from "@/lib/clinical-content";
import type { TreatmentType } from "@/lib/schemas/profile";

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

  // Idempotent on (user_id, milestone_key) so re-seeding (e.g. if the user
  // re-runs onboarding after editing their treatment type) is safe.
  const { error } = await supabase
    .from("milestones")
    .upsert(rows, {
      onConflict: "user_id,milestone_key",
      ignoreDuplicates: true,
    });

  if (error) throw error;
}
