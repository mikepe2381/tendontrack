import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { requireOnboardedProfile } from "@/lib/auth/gates";

type SettingsLink = {
  href: string;
  title: string;
  description: string;
  available: boolean;
};

const SETTINGS_LINKS: SettingsLink[] = [
  {
    href: "/settings/supplements",
    title: "Supplements",
    description: "Your supplement stack — used in the daily check-in.",
    available: true,
  },
  {
    href: "/settings/profile",
    title: "Profile",
    description: "Treatment type, dates, affected side.",
    available: false,
  },
  {
    href: "/settings/export",
    title: "Export data",
    description: "Download your full history as JSON or CSV.",
    available: false,
  },
];

export default async function SettingsPage() {
  await requireOnboardedProfile();

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
      </header>

      <ul className="divide-y divide-border rounded-md border border-border">
        {SETTINGS_LINKS.map((item) => {
          const inner = (
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="space-y-0.5">
                <p className="font-medium">
                  {item.title}
                  {!item.available ? (
                    <span className="ml-2 text-xs font-normal uppercase tracking-wide text-muted-foreground">
                      Coming soon
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.available ? (
                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 text-muted-foreground"
                />
              ) : null}
            </div>
          );
          return (
            <li key={item.href}>
              {item.available ? (
                <Link
                  href={item.href}
                  className="block transition-colors hover:bg-accent/40"
                >
                  {inner}
                </Link>
              ) : (
                <div aria-disabled="true" className="opacity-60">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
