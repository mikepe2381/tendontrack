"use server";

import { revalidatePath } from "next/cache";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import { profileSettingsSchema } from "@/lib/schemas/profile";

export type ProfileUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileSettings(
  raw: unknown,
): Promise<ProfileUpdateResult> {
  const parsed = profileSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }

  const { supabase, user } = await requireOnboardedProfile();
  const data = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.display_name?.trim() || null,
      injury_date: data.injury_date,
      treatment_type: data.treatment_type,
      surgery_date:
        data.treatment_type === "surgical" && data.surgery_date
          ? data.surgery_date
          : null,
      affected_side: data.affected_side,
      timezone: data.timezone || "UTC",
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");
  revalidatePath("/timeline");
  return { ok: true };
}
