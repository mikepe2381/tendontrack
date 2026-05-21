"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/gates";
import { seedMilestonesForUser } from "@/lib/milestones/seed";
import { profileFormSchema } from "@/lib/schemas/profile";

export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeOnboarding(
  raw: unknown,
): Promise<OnboardingResult> {
  const parsed = profileFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }

  const { supabase, user } = await requireUser();
  const data = parsed.data;

  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      injury_date: data.injury_date,
      treatment_type: data.treatment_type,
      surgery_date:
        data.treatment_type === "surgical" && data.surgery_date
          ? data.surgery_date
          : null,
      affected_side: data.affected_side,
      timezone: data.timezone || "UTC",
      onboarding_complete: true,
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  try {
    await seedMilestonesForUser(supabase, user.id, data.treatment_type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Couldn't seed milestones: ${message}` };
  }

  redirect("/dashboard");
}
