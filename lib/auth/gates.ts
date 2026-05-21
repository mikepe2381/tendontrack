import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TreatmentType, AffectedSide } from "@/lib/schemas/profile";

type Profile = {
  user_id: string;
  display_name: string | null;
  injury_date: string;
  treatment_type: TreatmentType;
  surgery_date: string | null;
  affected_side: AffectedSide | null;
  timezone: string;
  onboarding_complete: boolean;
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireOnboardedProfile() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, injury_date, treatment_type, surgery_date, affected_side, timezone, onboarding_complete",
    )
    .eq("user_id", user.id)
    .maybeSingle<Profile>();

  if (!profile || !profile.onboarding_complete) {
    redirect("/onboarding");
  }
  return { supabase, user, profile };
}
