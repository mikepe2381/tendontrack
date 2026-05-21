import type { TreatmentType } from "@/lib/schemas/profile";

export type EvidenceLevel = "high" | "moderate" | "low" | "expert_opinion";

export type MilestoneTemplate = {
  key: string;
  label: string;
  expected_week_min: number;
  expected_week_max: number;
  what_to_expect: string;
  source: string;
  evidence_level: EvidenceLevel;
};

// NOTE: This is a placeholder library to unblock onboarding + seeding for
// milestone 2. Milestone 5 replaces this with the full content from SPEC §5
// (surgical + non-surgical pathways, every milestone, cited sources). The
// seeding logic in lib/milestones/seed.ts reads from this module so milestone
// 5 can swap the data without touching the seed code.
const SURGICAL_TEMPLATES: MilestoneTemplate[] = [
  {
    key: "boot_transition",
    label: "Transition to walking boot",
    expected_week_min: 2,
    expected_week_max: 3,
    what_to_expect:
      "Placeholder entry. Full clinical content lands in milestone 5.",
    source: "Placeholder",
    evidence_level: "moderate",
  },
];

const NON_SURGICAL_TEMPLATES: MilestoneTemplate[] = [
  {
    key: "boot_with_wedges",
    label: "Boot with wedges",
    expected_week_min: 0,
    expected_week_max: 2,
    what_to_expect:
      "Placeholder entry. Full clinical content lands in milestone 5.",
    source: "Placeholder",
    evidence_level: "moderate",
  },
];

export function getMilestoneTemplates(
  pathway: TreatmentType,
): MilestoneTemplate[] {
  return pathway === "surgical"
    ? SURGICAL_TEMPLATES
    : NON_SURGICAL_TEMPLATES;
}
