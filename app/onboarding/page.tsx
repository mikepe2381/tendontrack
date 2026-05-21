import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/gates";
import { OnboardingWizard } from "@/app/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle<{ onboarding_complete: boolean }>();

  if (profile?.onboarding_complete) {
    redirect("/dashboard");
  }

  return (
    <div className="container max-w-xl py-10">
      <OnboardingWizard />
    </div>
  );
}
