import Link from "next/link";

import { ExportPanel } from "@/app/settings/export/export-panel";
import { requireOnboardedProfile } from "@/lib/auth/gates";

export default async function ExportPage() {
  await requireOnboardedProfile();

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/settings" className="underline-offset-2 hover:underline">
            Settings
          </Link>{" "}
          / Export data
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Export</h1>
        <p className="text-sm text-muted-foreground">
          Your data, exported in standard formats. JSON preserves all fields
          including markdown content. CSVs are easier to open in Excel/Sheets.
        </p>
      </header>

      <ExportPanel />
    </div>
  );
}
