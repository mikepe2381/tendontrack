import Link from "next/link";

import { AccountActions } from "@/app/settings/account/account-actions";
import { requireOnboardedProfile } from "@/lib/auth/gates";

export default async function AccountSettingsPage() {
  const { user } = await requireOnboardedProfile();

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/settings" className="underline-offset-2 hover:underline">
            Settings
          </Link>{" "}
          / Account
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
      </header>

      <section className="space-y-2 rounded-md border border-border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Email
        </p>
        <p className="break-all font-medium">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          To change your email, sign out and start a new account with the
          desired address.
        </p>
      </section>

      <AccountActions />
    </div>
  );
}
