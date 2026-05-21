"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { browserTimezone } from "@/lib/dates";
import {
  AFFECTED_SIDES,
  TREATMENT_TYPES,
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/schemas/profile";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const TREATMENT_LABELS: Record<(typeof TREATMENT_TYPES)[number], string> = {
  surgical: "Surgical repair",
  non_surgical: "Non-surgical (conservative)",
};

const SIDE_LABELS: Record<(typeof AFFECTED_SIDES)[number], string> = {
  left: "Left",
  right: "Right",
  both: "Both",
};

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const defaultTimezone = useMemo(() => browserTimezone(), []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onTouched",
    defaultValues: {
      treatment_type: undefined as unknown as ProfileFormValues["treatment_type"],
      injury_date: "",
      surgery_date: "",
      affected_side: undefined as unknown as ProfileFormValues["affected_side"],
      timezone: defaultTimezone,
    },
  });

  const treatmentType = form.watch("treatment_type");

  async function goNext() {
    let fields: (keyof ProfileFormValues)[] = [];
    if (step === 1) fields = ["treatment_type"];
    if (step === 2) {
      fields = ["injury_date", "affected_side"];
      if (treatmentType === "surgical") fields.push("surgery_date");
    }
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : s));
  }

  function goBack() {
    setServerError(null);
    setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : s));
  }

  function onSubmit(values: ProfileFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await completeOnboarding(values);
      if (result && !result.ok) {
        setServerError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8"
      noValidate
    >
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 1 && "How was your injury managed?"}
          {step === 2 && "Tell us about your timeline"}
          {step === 3 && "You're all set"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 &&
            "Recovery looks different for surgical and non-surgical Achilles tears."}
          {step === 2 &&
            "Dates anchor your timeline and the week-since-injury view on the dashboard."}
          {step === 3 &&
            "You can add supplements in Settings after onboarding — we'll skip that for now."}
        </p>
      </header>

      {step === 1 && (
        <fieldset className="space-y-3">
          <legend className="sr-only">Treatment type</legend>
          {TREATMENT_TYPES.map((value) => {
            const selected = treatmentType === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent/40",
                )}
              >
                <input
                  type="radio"
                  value={value}
                  className="mt-1 size-4"
                  {...form.register("treatment_type")}
                />
                <span>
                  <span className="block font-medium">
                    {TREATMENT_LABELS[value]}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {value === "surgical"
                      ? "You had (or will have) an operative repair."
                      : "You're following a non-operative protocol — typically boot + wedges."}
                  </span>
                </span>
              </label>
            );
          })}
          {form.formState.errors.treatment_type ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.treatment_type.message}
            </p>
          ) : null}
        </fieldset>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="injury_date">Date of injury</Label>
            <Input
              id="injury_date"
              type="date"
              {...form.register("injury_date")}
            />
            {form.formState.errors.injury_date ? (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.injury_date.message}
              </p>
            ) : null}
          </div>

          {treatmentType === "surgical" ? (
            <div className="space-y-2">
              <Label htmlFor="surgery_date">Date of surgery</Label>
              <Input
                id="surgery_date"
                type="date"
                {...form.register("surgery_date")}
              />
              {form.formState.errors.surgery_date ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.surgery_date.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Affected side</legend>
            <div
              role="radiogroup"
              className="grid grid-cols-3 gap-2"
            >
              {AFFECTED_SIDES.map((value) => {
                const id = `side-${value}`;
                return (
                  <label
                    key={value}
                    htmlFor={id}
                    className={cn(
                      "flex h-10 cursor-pointer items-center justify-center rounded-md border border-border text-sm font-medium transition-colors",
                      form.watch("affected_side") === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent/40",
                    )}
                  >
                    <input
                      id={id}
                      type="radio"
                      value={value}
                      className="sr-only"
                      {...form.register("affected_side")}
                    />
                    {SIDE_LABELS[value]}
                  </label>
                );
              })}
            </div>
            {form.formState.errors.affected_side ? (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.affected_side.message}
              </p>
            ) : null}
          </fieldset>

          <input type="hidden" {...form.register("timezone")} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium text-foreground">Supplements</p>
            <p className="mt-1 text-muted-foreground">
              You can add your supplement stack later from Settings →
              Supplements. Skipping this step now keeps onboarding short.
            </p>
          </div>
          {serverError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </p>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 1 || pending}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={goNext} disabled={pending}>
            Next
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Finish"}
          </Button>
        )}
      </div>
    </form>
  );
}
