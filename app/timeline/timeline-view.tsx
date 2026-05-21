"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EvidenceBadge } from "@/components/evidence-badge";
import { cn } from "@/lib/utils";
import type {
  EvidenceLevel,
  MilestonePhase,
} from "@/lib/clinical-content";
import { MILESTONE_PHASE_LABELS } from "@/lib/clinical-content";

import {
  markMilestoneAchieved,
  unmarkMilestoneAchieved,
} from "./actions";

export type TimelineMilestone = {
  key: string;
  label: string;
  phase: MilestonePhase;
  expected_week_min: number;
  expected_week_max: number;
  what_to_expect: string;
  source: string;
  evidence_level: EvidenceLevel;
  achieved_date: string | null;
  notes: string | null;
};

const MIN_TIMELINE_END_WEEK = 60;
const PIXELS_PER_WEEK = 16;
const WEEK_LABEL_INTERVAL = 4;

const PHASE_BAND_STYLES: Record<MilestonePhase, string> = {
  acute: "bg-sky-100 dark:bg-sky-950/40 border-sky-300/70 dark:border-sky-800",
  early_rehab:
    "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300/70 dark:border-emerald-800",
  mid_rehab:
    "bg-violet-100 dark:bg-violet-950/40 border-violet-300/70 dark:border-violet-800",
  return_to_activity:
    "bg-amber-100 dark:bg-amber-950/40 border-amber-300/70 dark:border-amber-800",
};

export function TimelineView({
  milestones,
  currentWeek,
  anchorLabel,
}: {
  milestones: TimelineMilestone[];
  currentWeek: number;
  anchorLabel: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const endWeek = useMemo(() => {
    const latest = milestones.reduce(
      (max, m) => Math.max(max, m.expected_week_max),
      0,
    );
    return Math.max(MIN_TIMELINE_END_WEEK, currentWeek + 4, latest + 2);
  }, [milestones, currentWeek]);

  const trackWidth = (endWeek + 1) * PIXELS_PER_WEEK;
  const currentLeftPct = clampPct((currentWeek / endWeek) * 100);

  // "What's typical right now" — milestones whose range overlaps the current
  // week. Cap at 3 so the panel doesn't become a wall.
  const typicalNow = useMemo(
    () =>
      milestones
        .filter(
          (m) =>
            currentWeek >= m.expected_week_min &&
            currentWeek <= m.expected_week_max,
        )
        .slice(0, 3),
    [milestones, currentWeek],
  );

  const active = milestones.find((m) => m.key === activeKey) ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <span>
            Weeks {anchorLabel}. Bands show typical ranges; tap one for detail.
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs sm:mt-0">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-rose-500"
            />
            You are here (week {currentWeek})
          </span>
        </div>

        <div className="overflow-x-auto">
          <div
            className="relative px-4 py-4"
            style={{ minWidth: `${trackWidth}px` }}
          >
            <WeekAxis endWeek={endWeek} />

            <div className="relative mt-2">
              {milestones.map((m) => {
                const leftPct = (m.expected_week_min / endWeek) * 100;
                const widthPct =
                  ((m.expected_week_max - m.expected_week_min + 1) / endWeek) *
                  100;
                const achieved = Boolean(m.achieved_date);
                return (
                  <div key={m.key} className="relative mb-2 h-9 last:mb-0">
                    <button
                      type="button"
                      onClick={() => setActiveKey(m.key)}
                      className={cn(
                        "group absolute inset-y-0 flex items-center gap-1.5 truncate rounded-md border px-2 text-xs font-medium transition-all",
                        "hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        PHASE_BAND_STYLES[m.phase],
                        achieved && "ring-2 ring-foreground/70",
                      )}
                      style={{
                        left: `${clampPct(leftPct)}%`,
                        width: `${Math.max(2.5, widthPct)}%`,
                      }}
                      aria-label={`${m.label}, weeks ${m.expected_week_min} to ${m.expected_week_max}${achieved ? ", achieved" : ""}`}
                    >
                      {achieved ? (
                        <Check aria-hidden className="h-3 w-3 shrink-0" />
                      ) : null}
                      <span className="truncate">{m.label}</span>
                      <span className="ml-auto hidden shrink-0 text-[10px] opacity-70 group-hover:inline sm:inline">
                        w{m.expected_week_min}–{m.expected_week_max}
                      </span>
                    </button>
                  </div>
                );
              })}

              <div
                className="pointer-events-none absolute -top-2 bottom-0 z-10 w-px bg-rose-500"
                style={{ left: `${currentLeftPct}%` }}
                aria-hidden
              >
                <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-rose-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What&apos;s typical right now
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Week {currentWeek} {anchorLabel}.
        </p>
        {typicalNow.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No milestones with a published range overlap this week. Use the
            timeline above to see what&apos;s coming up next.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {typicalNow.map((m) => (
              <li key={m.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveKey(m.key)}
                    className="text-left text-sm font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    {m.label}
                  </button>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    wk {m.expected_week_min}–{m.expected_week_max}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {m.what_to_expect}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {active ? (
        <MilestoneSheet
          milestone={active}
          onClose={() => setActiveKey(null)}
        />
      ) : null}
    </div>
  );
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function WeekAxis({ endWeek }: { endWeek: number }) {
  const ticks: number[] = [];
  for (let w = 0; w <= endWeek; w += WEEK_LABEL_INTERVAL) {
    ticks.push(w);
  }
  return (
    <div className="relative h-6 border-b border-border">
      {ticks.map((w) => {
        const leftPct = clampPct((w / endWeek) * 100);
        return (
          <div
            key={w}
            className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground"
            style={{ left: `${leftPct}%` }}
          >
            <div className="h-2 w-px bg-border" />
            <div className="mt-0.5">w{w}</div>
          </div>
        );
      })}
    </div>
  );
}

function MilestoneSheet({
  milestone,
  onClose,
}: {
  milestone: TimelineMilestone;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const achieved = Boolean(milestone.achieved_date);

  function onMark() {
    setError(null);
    startTransition(async () => {
      const res = await markMilestoneAchieved(milestone.key);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Milestone marked achieved");
      onClose();
    });
  }

  function onUnmark() {
    setError(null);
    startTransition(async () => {
      const res = await unmarkMilestoneAchieved(milestone.key);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Milestone unmarked");
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`milestone-${milestone.key}-title`}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-xl border border-border bg-background p-5 shadow-lg sm:rounded-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {MILESTONE_PHASE_LABELS[milestone.phase]} · weeks{" "}
              {milestone.expected_week_min}–{milestone.expected_week_max}
            </p>
            <h2
              id={`milestone-${milestone.key}-title`}
              className="text-xl font-semibold tracking-tight"
            >
              {milestone.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <EvidenceBadge level={milestone.evidence_level} />
        </div>

        <p className="mt-4 text-sm leading-relaxed">
          {milestone.what_to_expect}
        </p>

        <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs">
          <p className="font-medium text-muted-foreground">Source</p>
          <p className="mt-0.5 text-muted-foreground">{milestone.source}</p>
        </div>

        {milestone.achieved_date ? (
          <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
            Achieved on {formatDate(milestone.achieved_date)}.
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Close
          </Button>
          {achieved ? (
            <Button
              type="button"
              variant="outline"
              onClick={onUnmark}
              disabled={isPending}
            >
              Unmark achieved
            </Button>
          ) : (
            <Button type="button" onClick={onMark} disabled={isPending}>
              <Check aria-hidden className="h-4 w-4" />
              Mark achieved (today)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  // Render YYYY-MM-DD as a stable, locale-neutral string. Using the parts
  // directly avoids timezone-shifted display (e.g., the 1st showing as the
  // 31st in negative-UTC zones).
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
