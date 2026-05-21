"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import { appointmentFormSchema } from "@/lib/schemas/appointment";

export type AppointmentResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

// datetime-local emits a wall-clock timestamp with no zone. We convert it to
// an ISO string using the browser's local interpretation — but since this is
// the server, we just trust the client's "local" wall time as UTC for storage
// and let display logic format it back. The simpler, more correct path: keep
// it as the user typed it and let Postgres coerce. We append a Z so it's
// stored unambiguously and we don't get DST drift between client and server.
function toTimestamptz(local: string): string {
  // If already has a Z or offset, return as-is.
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(local)) return local;
  // Append seconds if missing, then Z.
  const withSeconds = /T\d{2}:\d{2}$/.test(local) ? `${local}:00` : local;
  return `${withSeconds}Z`;
}

export async function createAppointment(
  raw: unknown,
): Promise<AppointmentResult> {
  const parsed = appointmentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }
  const data = parsed.data;
  const { supabase, user } = await requireOnboardedProfile();

  const { data: inserted, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      appointment_date: toTimestamptz(data.appointment_date),
      provider_name: data.provider_name ?? null,
      provider_type: data.provider_type ?? null,
      location: data.location ?? null,
      status: data.status,
      prep_questions: data.prep_questions ?? null,
      outcome_notes: data.outcome_notes ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { ok: true, id: inserted?.id };
}

export async function updateAppointment(
  id: string,
  raw: unknown,
): Promise<AppointmentResult> {
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing appointment id" };
  }
  const parsed = appointmentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Some fields are invalid. Please review and try again.",
    };
  }
  const data = parsed.data;
  const { supabase, user } = await requireOnboardedProfile();

  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: toTimestamptz(data.appointment_date),
      provider_name: data.provider_name ?? null,
      provider_type: data.provider_type ?? null,
      location: data.location ?? null,
      status: data.status,
      prep_questions: data.prep_questions ?? null,
      outcome_notes: data.outcome_notes ?? null,
    })
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/appointments");
  revalidatePath(`/appointments/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAppointment(id: string): Promise<void> {
  if (typeof id !== "string" || !id) return;
  const { supabase, user } = await requireOnboardedProfile();
  await supabase
    .from("appointments")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  redirect("/appointments");
}
