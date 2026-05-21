import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentForm } from "@/app/appointments/appointment-form";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import type {
  AppointmentFormValues,
  AppointmentStatus,
} from "@/lib/schemas/appointment";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  provider_name: string | null;
  provider_type: string | null;
  location: string | null;
  status: AppointmentStatus;
  prep_questions: string | null;
  outcome_notes: string | null;
};

// Convert a stored ISO timestamp into the "YYYY-MM-DDTHH:MM" string that
// datetime-local expects, in the user's configured timezone.
function isoToDatetimeLocal(iso: string, timezone: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(t));
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

type PageParams = { params: Promise<{ id: string }> };

export default async function AppointmentDetailPage({ params }: PageParams) {
  const { id } = await params;
  const { supabase, user, profile } = await requireOnboardedProfile();

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, provider_name, provider_type, location, status, prep_questions, outcome_notes",
    )
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle<AppointmentRow>();

  if (!data) notFound();

  const defaultValues: AppointmentFormValues = {
    appointment_date: isoToDatetimeLocal(
      data.appointment_date,
      profile.timezone || "UTC",
    ),
    provider_name: data.provider_name ?? undefined,
    provider_type: data.provider_type ?? undefined,
    location: data.location ?? undefined,
    status: data.status,
    prep_questions: data.prep_questions ?? undefined,
    outcome_notes: data.outcome_notes ?? undefined,
  };

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/appointments"
            className="underline-offset-2 hover:underline"
          >
            Appointments
          </Link>{" "}
          / Detail
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Edit appointment
        </h1>
      </header>

      <AppointmentForm
        mode="edit"
        appointmentId={data.id}
        defaultValues={defaultValues}
      />
    </div>
  );
}
