"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import { seedMilestonesForUser } from "@/lib/milestones/seed";
import { todayInTimezone, isIsoDate } from "@/lib/dates";

export type MilestoneActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function markMilestoneAchieved(
  milestoneKey: string,
  achievedDate?: string,
): Promise<MilestoneActionResult> {
  if (typeof milestoneKey !== "string" || !milestoneKey) {
    return { ok: false, error: "Missing milestone key" };
  }

  const { supabase, user, profile } = await requireOnboardedProfile();
  const tz = profile.timezone || "UTC";
  const today = todayInTimezone(tz);

  const date =
    typeof achievedDate === "string" && isIsoDate(achievedDate)
      ? achievedDate
      : today;

  // Reject obviously-future dates (browser clock skew, hand-typed). We can't
  // do this in the DB without a per-user timezone, so it lives here.
  if (Date.parse(`${date}T00:00:00Z`) > Date.parse(`${today}T00:00:00Z`)) {
    return { ok: false, error: "Achieved date can't be in the future" };
  }

  const { error } = await supabase
    .from("milestones")
    .update({ achieved_date: date })
    .eq("user_id", user.id)
    .eq("milestone_key", milestoneKey);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/timeline");
  revalidatePath("/reference/recovery");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function unmarkMilestoneAchieved(
  milestoneKey: string,
): Promise<MilestoneActionResult> {
  if (typeof milestoneKey !== "string" || !milestoneKey) {
    return { ok: false, error: "Missing milestone key" };
  }
  const { supabase, user } = await requireOnboardedProfile();

  const { error } = await supabase
    .from("milestones")
    .update({ achieved_date: null })
    .eq("user_id", user.id)
    .eq("milestone_key", milestoneKey);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/timeline");
  revalidatePath("/reference/recovery");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Re-runs the seed using the current clinical library. Idempotent. New
// milestones in the library appear; existing rows keep their achieved_date
// and notes (see lib/milestones/seed.ts).
export async function reseedMilestones(): Promise<MilestoneActionResult> {
  const { supabase, user, profile } = await requireOnboardedProfile();
  try {
    await seedMilestonesForUser(supabase, user.id, profile.treatment_type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
  revalidatePath("/timeline");
  revalidatePath("/reference/recovery");
  return { ok: true };
}
