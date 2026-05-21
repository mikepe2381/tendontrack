import { z } from "zod";

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

// datetime-local emits "YYYY-MM-DDTHH:MM" (optionally with seconds). We
// validate that shape directly rather than relying on Date.parse — Date.parse
// of a bare local datetime is implementation-defined in older runtimes.
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export const appointmentFormSchema = z.object({
  appointment_date: z
    .string()
    .min(1, "Date and time are required")
    .regex(LOCAL_DATETIME, "Pick a valid date and time")
    .refine(
      (s) => !Number.isNaN(Date.parse(s)),
      "Pick a valid date and time",
    ),
  provider_name: z
    .string()
    .max(120, "Provider name can't exceed 120 characters")
    .optional(),
  provider_type: z
    .string()
    .max(60, "Provider type can't exceed 60 characters")
    .optional(),
  location: z
    .string()
    .max(200, "Location can't exceed 200 characters")
    .optional(),
  status: z.enum(APPOINTMENT_STATUSES),
  prep_questions: z
    .string()
    .max(10000, "Questions can't exceed 10000 characters")
    .optional(),
  outcome_notes: z
    .string()
    .max(10000, "Notes can't exceed 10000 characters")
    .optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Future-or-now if the appointment is still scheduled; past is fine for any
// status (people backfill historical appointments after the fact).
export function isAppointmentUpcoming(
  appointmentDate: string,
  status: AppointmentStatus,
  now: Date = new Date(),
): boolean {
  if (status !== "scheduled") return false;
  const t = Date.parse(appointmentDate);
  if (Number.isNaN(t)) return false;
  return t >= now.getTime();
}
