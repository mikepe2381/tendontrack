import { ClinicalDisclaimer } from "@/components/clinical-disclaimer";
import { EvidenceBadge } from "@/components/evidence-badge";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import {
  MILESTONE_PHASES,
  MILESTONE_PHASE_LABELS,
  getMilestoneTemplates,
  type MilestonePhase,
  type MilestoneTemplate,
} from "@/lib/clinical-content";

const TREATMENT_LABEL: Record<string, string> = {
  surgical: "surgical (operative repair)",
  non_surgical: "non-surgical (conservative)",
};

export default async function RecoveryReferencePage() {
  const { profile } = await requireOnboardedProfile();

  const templates = getMilestoneTemplates(profile.treatment_type);

  const grouped = MILESTONE_PHASES.reduce<
    Record<MilestonePhase, MilestoneTemplate[]>
  >(
    (acc, phase) => {
      acc[phase] = templates
        .filter((t) => t.phase === phase)
        .sort((a, b) => a.expected_week_min - b.expected_week_min);
      return acc;
    },
    {
      acute: [],
      early_rehab: [],
      mid_rehab: [],
      return_to_activity: [],
    },
  );

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Reference</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Recovery roadmap
        </h1>
        <p className="text-sm text-muted-foreground">
          Every milestone in your {TREATMENT_LABEL[profile.treatment_type] ?? profile.treatment_type}{" "}
          pathway, grouped by phase. Ranges are typical, not prescriptive.
        </p>
      </header>

      <ClinicalDisclaimer />

      <div className="space-y-8">
        {MILESTONE_PHASES.map((phase) => {
          const items = grouped[phase];
          if (items.length === 0) return null;
          return (
            <section key={phase} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {MILESTONE_PHASE_LABELS[phase]}
              </h2>
              <ul className="space-y-3">
                {items.map((m) => (
                  <li
                    key={m.key}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-base font-semibold">
                        {m.label}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        weeks {m.expected_week_min}–{m.expected_week_max}
                      </span>
                    </div>
                    <div className="mt-2">
                      <EvidenceBadge level={m.evidence_level} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">
                      {m.what_to_expect}
                    </p>
                    <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Source: </span>
                      {m.source}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
