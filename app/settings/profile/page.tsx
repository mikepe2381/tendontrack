import Link from "next/link";

import { ProfileSettingsForm } from "@/app/settings/profile/profile-settings-form";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import type { ProfileSettingsValues } from "@/lib/schemas/profile";

export default async function ProfileSettingsPage() {
  const { profile } = await requireOnboardedProfile();

  const defaultValues: ProfileSettingsValues = {
    display_name: profile.display_name ?? "",
    treatment_type: profile.treatment_type,
    injury_date: profile.injury_date,
    surgery_date: profile.surgery_date ?? "",
    affected_side: profile.affected_side ?? "left",
    timezone: profile.timezone || "UTC",
  };

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/settings" className="underline-offset-2 hover:underline">
            Settings
          </Link>{" "}
          / Profile
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Edit how the app is anchored — your timeline, weeks-since count, and
          dashboard greeting all come from these.
        </p>
      </header>

      <ProfileSettingsForm defaultValues={defaultValues} />
    </div>
  );
}
