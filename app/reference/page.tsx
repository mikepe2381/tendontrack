import Link from "next/link";

import { requireOnboardedProfile } from "@/lib/auth/gates";

const REFERENCE_PAGES = [
  {
    href: "/reference/recovery",
    label: "Recovery roadmap",
    description:
      "Every milestone in your treatment pathway, grouped by phase, with typical week ranges.",
  },
  {
    href: "/reference/supplements",
    label: "Supplement evidence",
    description:
      "What the research actually says about supplements commonly used during tendon recovery.",
  },
];

export default async function ReferenceIndexPage() {
  await requireOnboardedProfile();

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Reference</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Clinical reference
        </h1>
        <p className="text-sm text-muted-foreground">
          Background reading drawn from current research. Ranges and evidence
          ratings are typical, not prescriptive.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {REFERENCE_PAGES.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent/40"
            >
              <p className="text-base font-semibold">{p.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
