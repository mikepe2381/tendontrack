import { cn } from "@/lib/utils";
import {
  EVIDENCE_LABELS,
  SUPPLEMENT_EVIDENCE_LABELS,
  type EvidenceLevel,
  type SupplementEvidenceLevel,
} from "@/lib/clinical-content";

type Level = EvidenceLevel | SupplementEvidenceLevel;

const STYLES: Record<Level, string> = {
  high: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-300/60 dark:border-emerald-800",
  moderate:
    "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200 border-sky-300/60 dark:border-sky-800",
  low: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300/60 dark:border-amber-800",
  expert_opinion:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-300/60 dark:border-zinc-700",
  theoretical:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-300/60 dark:border-zinc-700",
};

export function EvidenceBadge({
  level,
  className,
}: {
  level: Level;
  className?: string;
}) {
  const label =
    level === "theoretical"
      ? SUPPLEMENT_EVIDENCE_LABELS.theoretical
      : EVIDENCE_LABELS[level as EvidenceLevel] ??
        SUPPLEMENT_EVIDENCE_LABELS[level as SupplementEvidenceLevel];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STYLES[level],
        className,
      )}
    >
      Evidence: {label}
    </span>
  );
}
