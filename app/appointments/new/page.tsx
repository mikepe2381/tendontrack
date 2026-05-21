import Link from "next/link";

import { AppointmentForm } from "@/app/appointments/appointment-form";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import type { AppointmentFormValues } from "@/lib/schemas/appointment";

// Default the form to one hour from now, rounded to the next 15 minutes, in
// the user's timezone. datetime-local needs a "YYYY-MM-DDTHH:MM" string
// expressed in the visible local time.
function defaultAppointmentDateLocal(timezone: string): string {
  const now = new Date(Date.now() + 60 * 60 * 1000);
  const minutes = now.getMinutes();
  const rounded = Math.ceil(minutes / 15) * 15;
  now.setMinutes(rounded, 0, 0);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function NewAppointmentPage() {
  const { profile } = await requireOnboardedProfile();
  const defaultValues: AppointmentFormValues = {
    appointment_date: defaultAppointmentDateLocal(profile.timezone || "UTC"),
    provider_name: undefined,
    provider_type: undefined,
    location: undefined,
    status: "scheduled",
    prep_questions: undefined,
    outcome_notes: undefined,
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
          / New
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Add appointment
        </h1>
      </header>

      <AppointmentForm mode="create" defaultValues={defaultValues} />
    </div>
  );
}
