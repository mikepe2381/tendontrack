"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
} from "@/app/appointments/actions";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  appointmentFormSchema,
  type AppointmentFormValues,
  type AppointmentStatus,
} from "@/lib/schemas/appointment";
import { cn } from "@/lib/utils";

type Props = {
  mode: "create" | "edit";
  appointmentId?: string;
  defaultValues: AppointmentFormValues;
};

function setValueAsOptionalString(v: unknown): string | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  return String(v);
}

// Decide which markdown field is "live" (editable + visible by default).
// scheduled OR future-dated → prep questions. Otherwise → outcome notes.
function activeFieldFor(
  status: AppointmentStatus,
  appointmentDate: string,
): "prep" | "outcome" {
  if (status === "scheduled") return "prep";
  const t = Date.parse(appointmentDate);
  if (Number.isFinite(t) && t > Date.now()) return "prep";
  return "outcome";
}

export function AppointmentForm({ mode, appointmentId, defaultValues }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  const status = form.watch("status");
  const appointmentDate = form.watch("appointment_date");
  const prep = form.watch("prep_questions") ?? "";
  const outcome = form.watch("outcome_notes") ?? "";
  const activeField = useMemo(
    () => activeFieldFor(status, appointmentDate),
    [status, appointmentDate],
  );

  function onSubmit(values: AppointmentFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAppointment(values)
          : await updateAppointment(appointmentId ?? "", values);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === "create" ? "Appointment created" : "Appointment saved",
      );
      const target =
        mode === "create" && result.id
          ? `/appointments/${result.id}`
          : "/appointments";
      router.push(target);
    });
  }

  function onDelete() {
    if (mode !== "edit" || !appointmentId) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this appointment?")
    ) {
      return;
    }
    startDeleteTransition(async () => {
      const result = await deleteAppointment(appointmentId);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Appointment deleted");
      router.push("/appointments");
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <section className="space-y-2">
        <Label htmlFor="appointment_date">Date and time</Label>
        <Input
          id="appointment_date"
          type="datetime-local"
          {...form.register("appointment_date")}
        />
        {form.formState.errors.appointment_date ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.appointment_date.message}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Past and future dates are both fine — record historical visits or
          schedule upcoming ones.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-2">
          <Label htmlFor="provider_name">Provider name</Label>
          <Input
            id="provider_name"
            placeholder="Dr. Smith"
            autoComplete="off"
            {...form.register("provider_name", {
              setValueAs: setValueAsOptionalString,
            })}
          />
          {form.formState.errors.provider_name ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.provider_name.message}
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <Label htmlFor="provider_type">Provider type</Label>
          <Input
            id="provider_type"
            placeholder="Surgeon, Physio, GP…"
            autoComplete="off"
            {...form.register("provider_type", {
              setValueAs: setValueAsOptionalString,
            })}
          />
          {form.formState.errors.provider_type ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.provider_type.message}
            </p>
          ) : null}
        </section>
      </div>

      <section className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Clinic name, telehealth, address…"
          autoComplete="off"
          {...form.register("location", {
            setValueAs: setValueAsOptionalString,
          })}
        />
        {form.formState.errors.location ? (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.location.message}
          </p>
        ) : null}
      </section>

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <StatusSegmented value={field.value} onChange={field.onChange} />
        )}
      />

      <MarkdownEditorField
        id="prep_questions"
        label="Questions for this appointment"
        placeholder="What do you want to ask? Bullet points, paragraphs, links — all good."
        value={prep}
        onChange={(v) => form.setValue("prep_questions", v, { shouldDirty: true })}
        active={activeField === "prep"}
        otherHasContent={outcome.trim().length > 0}
        otherLabel="What we discussed"
      />

      <MarkdownEditorField
        id="outcome_notes"
        label="What we discussed"
        placeholder="Summary of the visit, decisions made, next steps."
        value={outcome}
        onChange={(v) => form.setValue("outcome_notes", v, { shouldDirty: true })}
        active={activeField === "outcome"}
        otherHasContent={prep.trim().length > 0}
        otherLabel="Questions for this appointment"
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
        <div className="flex flex-wrap gap-2">
          <Button
            key="appt-cancel"
            asChild
            type="button"
            variant="ghost"
            disabled={pending || deletePending}
          >
            <Link href="/appointments">Cancel</Link>
          </Button>
          {mode === "edit" ? (
            <Button
              key="appt-delete"
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={pending || deletePending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {deletePending ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
        </div>
        <Button
          key="appt-submit"
          type="submit"
          disabled={pending || deletePending}
          size="lg"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Add appointment"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function StatusSegmented({
  value,
  onChange,
}: {
  value: AppointmentStatus;
  onChange: (v: AppointmentStatus) => void;
}) {
  return (
    <section className="space-y-2">
      <Label>Status</Label>
      <div role="radiogroup" className="grid grid-cols-3 gap-2">
        {APPOINTMENT_STATUSES.map((s) => {
          const selected = value === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s)}
              className={cn(
                "flex min-h-[44px] items-center justify-center rounded-md border border-border px-2 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent/40",
              )}
            >
              {APPOINTMENT_STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </section>
  );
}

type MarkdownEditorFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  active: boolean;
  otherHasContent: boolean;
  otherLabel: string;
};

function MarkdownEditorField({
  id,
  label,
  placeholder,
  value,
  onChange,
  active,
  otherHasContent,
  otherLabel,
}: MarkdownEditorFieldProps) {
  // Mobile/tabbed view of edit-vs-preview. Defaults to edit on the active
  // field and preview on the inactive (read-only) one.
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">(
    active ? "edit" : "preview",
  );

  // Inactive field with no content shows as a collapsed hint, not an editor.
  if (!active && !value.trim()) {
    return (
      <section className="space-y-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Label className="text-muted-foreground">{label}</Label>
        <p className="text-xs">
          Switch status (or change the date) to edit this field.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={id} className={cn(!active && "text-muted-foreground")}>
          {label}
          {!active ? (
            <span className="ml-2 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
              Read-only
            </span>
          ) : null}
        </Label>
        {otherHasContent ? (
          <span className="text-xs text-muted-foreground">
            {otherLabel} preserved
          </span>
        ) : null}

        {active ? (
          <div className="flex gap-1 sm:hidden" role="tablist" aria-label={label}>
            <TabButton
              selected={mobileTab === "edit"}
              onClick={() => setMobileTab("edit")}
            >
              Write
            </TabButton>
            <TabButton
              selected={mobileTab === "preview"}
              onClick={() => setMobileTab("preview")}
            >
              Preview
            </TabButton>
          </div>
        ) : null}
      </div>

      {active ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={cn(mobileTab === "edit" ? "block" : "hidden", "sm:block")}>
            <Textarea
              id={id}
              rows={8}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div
            className={cn(
              "rounded-md border border-border bg-card p-3",
              mobileTab === "preview" ? "block" : "hidden",
              "sm:block",
            )}
            aria-label={`${label} preview`}
          >
            <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <MarkdownPreview source={value} emptyLabel="Nothing to preview yet." />
          </div>
        </div>
      ) : (
        <div
          className="rounded-md border border-border bg-card p-3"
          aria-label={`${label} (read-only)`}
        >
          <MarkdownPreview source={value} />
        </div>
      )}
    </section>
  );
}

function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-accent/40",
      )}
    >
      {children}
    </button>
  );
}
