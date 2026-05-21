"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Heart, Star } from "lucide-react";
import { toast } from "sonner";

import type { SupplementFormItem } from "@/app/log/page";
import { upsertDailyLog } from "@/app/log/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MOBILITY_LABELS,
  MOBILITY_SHORT_LABELS,
  MOBILITY_STATUSES,
  dailyLogFormSchema,
  type DailyLogFormValues,
  type MobilityStatus,
} from "@/lib/schemas/daily-log";
import { SUPPLEMENT_TIMING_LABELS } from "@/lib/schemas/supplement";
import { cn } from "@/lib/utils";

type Props = {
  defaultValues: DailyLogFormValues;
  injuryDate: string;
  todayInTz: string;
  isEditing: boolean;
  supplements: SupplementFormItem[];
};

// Translate the empty HTML input value into undefined for optional fields,
// and a finite number when the user has typed one.
function setValueAsOptionalNumber(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function setValueAsOptionalString(v: unknown): string | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return String(v);
}

export function DailyLogForm({
  defaultValues,
  injuryDate,
  todayInTz,
  isEditing,
  supplements,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(dailyLogFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  function onSubmit(values: DailyLogFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await upsertDailyLog(values);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Log updated" : "Log saved");
      router.push("/dashboard");
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8"
      noValidate
    >
      <section className="space-y-2">
        <Label htmlFor="log_date">Date</Label>
        <Input
          id="log_date"
          type="date"
          min={injuryDate}
          max={todayInTz}
          {...form.register("log_date")}
        />
        {form.formState.errors.log_date ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.log_date.message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          All other fields are optional — log what you can.
        </p>
      </section>

      <Controller
        control={form.control}
        name="pain_level"
        render={({ field }) => (
          <SliderField
            label="Pain"
            min={0}
            max={10}
            step={1}
            value={field.value}
            onChange={field.onChange}
            leftHint="None"
            rightHint="Worst imaginable"
          />
        )}
      />

      <Controller
        control={form.control}
        name="swelling_level"
        render={({ field }) => (
          <SliderField
            label="Swelling"
            min={0}
            max={10}
            step={1}
            value={field.value}
            onChange={field.onChange}
            leftHint="None"
            rightHint="Severe"
          />
        )}
      />

      <Controller
        control={form.control}
        name="mobility_status"
        render={({ field }) => (
          <MobilitySegmented
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <section className="space-y-2">
        <Label htmlFor="sleep_hours">Sleep (hours)</Label>
        <Input
          id="sleep_hours"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={0}
          max={24}
          placeholder="e.g. 7.5"
          {...form.register("sleep_hours", {
            setValueAs: setValueAsOptionalNumber,
          })}
        />
        {form.formState.errors.sleep_hours ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.sleep_hours.message}
          </p>
        ) : null}
      </section>

      <Controller
        control={form.control}
        name="sleep_quality"
        render={({ field }) => (
          <RatingField
            label="Sleep quality"
            icon="star"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={form.control}
        name="mood"
        render={({ field }) => (
          <RatingField
            label="Mood"
            icon="heart"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <section className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={5}
          placeholder="Anything worth remembering — new exercises, pain triggers, questions for your care team…"
          {...form.register("notes", {
            setValueAs: setValueAsOptionalString,
          })}
        />
        {form.formState.errors.notes ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.notes.message}
          </p>
        ) : null}
      </section>

      <Controller
        control={form.control}
        name="supplements"
        render={({ field }) => (
          <SupplementsSection
            supplements={supplements}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={form.control}
        name="flagged_for_followup"
        render={({ field }) => (
          <FlagToggle
            value={Boolean(field.value)}
            onChange={field.onChange}
          />
        )}
      />

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          key="log-cancel"
          asChild
          type="button"
          variant="ghost"
          disabled={pending}
        >
          <Link href="/dashboard">Cancel</Link>
        </Button>
        <Button key="log-submit" type="submit" disabled={pending} size="lg">
          {pending ? "Saving…" : isEditing ? "Save changes" : "Save log"}
        </Button>
      </div>
    </form>
  );
}

type SliderFieldProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  leftHint?: string;
  rightHint?: string;
};

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  leftHint,
  rightHint,
}: SliderFieldProps) {
  const isSet = value !== undefined && value !== null;
  const numeric = isSet ? (value as number) : Math.round((min + max) / 2);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "tabular-nums text-lg font-semibold",
              !isSet && "text-muted-foreground",
            )}
          >
            {isSet ? numeric : "—"}
            {isSet ? <span className="text-muted-foreground">/{max}</span> : null}
          </span>
          {isSet ? (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              clear
            </button>
          ) : null}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numeric}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-full cursor-pointer appearance-none rounded-md bg-secondary accent-foreground"
        aria-label={label}
      />
      {leftHint || rightHint ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftHint}</span>
          <span>{rightHint}</span>
        </div>
      ) : null}
    </section>
  );
}

type MobilitySegmentedProps = {
  value: MobilityStatus | undefined;
  onChange: (v: MobilityStatus | undefined) => void;
};

function MobilitySegmented({ value, onChange }: MobilitySegmentedProps) {
  return (
    <section className="space-y-2">
      <Label>Mobility status</Label>
      <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MOBILITY_STATUSES.map((status) => {
          const selected = value === status;
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? undefined : status)}
              className={cn(
                "flex min-h-[44px] items-center justify-center rounded-md border border-border px-2 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent/40",
              )}
              title={MOBILITY_LABELS[status]}
            >
              {MOBILITY_SHORT_LABELS[status]}
            </button>
          );
        })}
      </div>
      {value ? (
        <p className="text-xs text-muted-foreground">
          {MOBILITY_LABELS[value]}
        </p>
      ) : null}
    </section>
  );
}

type RatingFieldProps = {
  label: string;
  icon: "star" | "heart";
  value: number | undefined;
  onChange: (v: number | undefined) => void;
};

function RatingField({ label, icon, value, onChange }: RatingFieldProps) {
  const Icon = icon === "star" ? Star : Heart;
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {value !== undefined ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            clear
          </button>
        ) : null}
      </div>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value !== undefined && n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${label}: ${n} of 5`}
              onClick={() => onChange(value === n ? undefined : n)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md border border-border transition-colors",
                filled
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/40",
              )}
            >
              <Icon
                className={cn("h-5 w-5", filled && "fill-current")}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

type SupplementCheckValue = { supplement_id: string; taken: boolean };

type SupplementsSectionProps = {
  supplements: SupplementFormItem[];
  value: SupplementCheckValue[];
  onChange: (next: SupplementCheckValue[]) => void;
};

function SupplementsSection({
  supplements,
  value,
  onChange,
}: SupplementsSectionProps) {
  const takenMap = new Map(value.map((v) => [v.supplement_id, v.taken]));

  function toggle(id: string) {
    const current = takenMap.get(id) ?? false;
    const next = supplements.map((s) => ({
      supplement_id: s.id,
      taken: s.id === id ? !current : (takenMap.get(s.id) ?? false),
    }));
    onChange(next);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label>Supplements</Label>
        <Link
          href="/settings/supplements"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Manage
        </Link>
      </div>

      {supplements.length === 0 ? (
        <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          No supplements set up yet.{" "}
          <Link
            href="/settings/supplements"
            className="underline-offset-4 hover:underline"
          >
            Add your stack
          </Link>{" "}
          and it&apos;ll show up here.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {supplements.map((s) => {
            const taken = takenMap.get(s.id) ?? false;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={taken}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/40",
                    s.inactiveHistorical && "opacity-70",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors",
                      taken
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                  >
                    {taken ? <Check className="h-4 w-4" /> : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
                    <span className="font-medium">{s.name}</span>
                    {s.dose ? (
                      <span className="text-sm text-muted-foreground">
                        {s.dose}
                      </span>
                    ) : null}
                    {s.timing ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {SUPPLEMENT_TIMING_LABELS[s.timing]}
                      </span>
                    ) : null}
                    {s.inactiveHistorical ? (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        Inactive — historical
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type FlagToggleProps = {
  value: boolean;
  onChange: (v: boolean) => void;
};

function FlagToggle({ value, onChange }: FlagToggleProps) {
  return (
    <section className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
      <div className="space-y-1">
        <Label htmlFor="flagged_for_followup" className="cursor-pointer">
          Flag for follow-up
        </Label>
        <p className="text-xs text-muted-foreground">
          Mark this day to revisit later — for example, a new symptom worth
          mentioning at your next appointment.
        </p>
      </div>
      <button
        id="flagged_for_followup"
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          value ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </section>
  );
}
