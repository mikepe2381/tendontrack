"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import {
  dailyLogFormSchema,
  validateLogDateAgainstProfile,
} from "@/lib/schemas/daily-log";

export type DailyLogResult =
  | { ok: true }
  | { ok: false; error: string };

export async function upsertDailyLog(raw: unknown): Promise<DailyLogResult> {
  const parsed = dailyLogFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }
  const data = parsed.data;

  const { supabase, user, profile } = await requireOnboardedProfile();

  const dateError = validateLogDateAgainstProfile(
    data.log_date,
    profile.injury_date,
    profile.timezone || "UTC",
  );
  if (dateError) return { ok: false, error: dateError };

  const row = {
    user_id: user.id,
    log_date: data.log_date,
    pain_level: data.pain_level ?? null,
    swelling_level: data.swelling_level ?? null,
    sleep_hours: data.sleep_hours ?? null,
    sleep_quality: data.sleep_quality ?? null,
    mood: data.mood ?? null,
    mobility_status: data.mobility_status ?? null,
    notes: data.notes ?? null,
    flagged_for_followup: data.flagged_for_followup,
  };

  const { error } = await supabase
    .from("daily_logs")
    .upsert(row, { onConflict: "user_id,log_date" });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/log/history");
  redirect("/dashboard");
}
