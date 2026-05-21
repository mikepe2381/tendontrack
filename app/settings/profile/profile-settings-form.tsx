"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { toast } from "sonner";

import { updateProfileSettings } from "@/app/settings/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AFFECTED_SIDES,
  TREATMENT_TYPES,
  profileSettingsSchema,
  type ProfileSettingsValues,
} from "@/lib/schemas/profile";
import { cn } from "@/lib/utils";

const TREATMENT_LABELS: Record<(typeof TREATMENT_TYPES)[number], string> = {
  surgical: "Surgical repair",
  non_surgical: "Non-surgical (conservative)",
};

const SIDE_LABELS: Record<(typeof AFFECTED_SIDES)[number], string> = {
  left: "Left",
  right: "Right",
  both: "Both",
};

function setValueAsOptionalString(v: unknown): string | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return String(v);
}

type Props = {
  defaultValues: ProfileSettingsValues;
};

export function ProfileSettingsForm({ defaultValues }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    mode: "onTouched",
    defaultValues,
  });

  const treatmentType = form.watch("treatment_type");
  const affectedSide = form.watch("affected_side");

  function onSubmit(values: ProfileSettingsValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateProfileSettings(values);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      // Reset to submitted values so the form isn't marked dirty post-save.
      form.reset(values);
      toast.success("Profile saved");
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <section className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          placeholder="Optional — what should we call you?"
          autoComplete="off"
          {...form.register("display_name", {
            setValueAs: setValueAsOptionalString,
          })}
        />
        {form.formState.errors.display_name ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.display_name.message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Used as the greeting on your dashboard. Leave blank to use your email.
        </p>
      </section>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Treatment type</legend>
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
                    : "Non-operative protocol — typically boot + wedges."}
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
        <aside
          role="note"
          className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm"
        >
          <Info
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          />
          <p className="text-muted-foreground">
            Treatment type changes don&apos;t re-seed your timeline — contact
            support if you need a full reset.
          </p>
        </aside>
      </fieldset>

      <section className="space-y-2">
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
      </section>

      {treatmentType === "surgical" ? (
        <section className="space-y-2">
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
        </section>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Affected side</legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-2">
          {AFFECTED_SIDES.map((value) => {
            const id = `side-${value}`;
            return (
              <label
                key={value}
                htmlFor={id}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-md border border-border text-sm font-medium transition-colors",
                  affectedSide === value
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

      <section className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          placeholder="e.g. America/Los_Angeles"
          autoComplete="off"
          {...form.register("timezone")}
        />
        {form.formState.errors.timezone ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.timezone.message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          IANA timezone identifier. Drives the &ldquo;today&rdquo; reference for
          your daily log.
        </p>
      </section>

      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
