import Link from "next/link";

import { ClinicalDisclaimer } from "@/components/clinical-disclaimer";
import { EvidenceBadge } from "@/components/evidence-badge";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import { SUPPLEMENT_EVIDENCE } from "@/lib/clinical-content";

export default async function SupplementsReferencePage() {
  await requireOnboardedProfile();

  const items = [...SUPPLEMENT_EVIDENCE].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <Link
          href="/reference"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Reference
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Supplement evidence
        </h1>
        <p className="text-sm text-muted-foreground">
          What the research actually says about supplements commonly used
          during tendon recovery. Sorted alphabetically. Evidence badges show
          how strong the underlying support is.
        </p>
      </header>

      <ClinicalDisclaimer />

      <ul className="space-y-4">
        {items.map((s) => (
          <li
            key={s.key}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {s.name}
              </h2>
              <EvidenceBadge level={s.evidence_level} />
            </div>

            <p className="mt-3 text-sm leading-relaxed">{s.summary}</p>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Typical dose
                </dt>
                <dd className="mt-0.5">{s.typical_dose}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Caveats
                </dt>
                <dd className="mt-0.5">{s.caveats}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-muted-foreground">Sources</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {s.sources.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <p className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Not listed here: BPC-157, TB-500, and similar peptides. Evidence for
        tendon healing in humans is too thin to recommend either way; if you
        choose to use them, do so under medical supervision.
      </p>
    </div>
  );
}
