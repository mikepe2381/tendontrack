import Link from "next/link";
import { Plus } from "lucide-react";

import { requireOnboardedProfile } from "@/lib/auth/gates";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/schemas/appointment";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  provider_name: string | null;
  provider_type: string | null;
  status: AppointmentStatus;
};

const STATUS_BADGE_STYLES: Record<AppointmentStatus, string> = {
  scheduled:
    "border-sky-300/70 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  completed:
    "border-emerald-300/70 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  cancelled:
    "border-border bg-muted text-muted-foreground",
};

export default async function AppointmentsPage() {
  const { supabase, user } = await requireOnboardedProfile();

  const { data, error } = await supabase
    .from("appointments")
    .select("id, appointment_date, provider_name, provider_type, status")
    .eq("user_id", user.id)
    .order("appointment_date", { ascending: false });

  const rows: AppointmentRow[] = error ? [] : ((data ?? []) as AppointmentRow[]);

  const nowMs = Date.now();
  const upcoming: AppointmentRow[] = [];
  const past: AppointmentRow[] = [];
  for (const row of rows) {
    const t = Date.parse(row.appointment_date);
    const isUpcoming =
      row.status === "scheduled" && !Number.isNaN(t) && t >= nowMs;
    if (isUpcoming) upcoming.push(row);
    else past.push(row);
  }
  // Soonest upcoming first; past stays newest-first (already sorted desc).
  upcoming.sort(
    (a, b) =>
      Date.parse(a.appointment_date) - Date.parse(b.appointment_date),
  );

  return (
    <div className="container relative max-w-3xl space-y-8 py-8 pb-28">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Track visits with your care team. Add questions before, capture what
          you discussed after.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Couldn&apos;t load your appointments: {error.message}
        </p>
      ) : null}

      <Section title="Upcoming">
        {upcoming.length === 0 ? (
          <EmptyState>No upcoming appointments scheduled.</EmptyState>
        ) : (
          <AppointmentList rows={upcoming} />
        )}
      </Section>

      <Section title="Past">
        {past.length === 0 ? (
          <EmptyState>No past appointments yet.</EmptyState>
        ) : (
          <AppointmentList rows={past} />
        )}
      </Section>

      <Link
        href="/appointments/new"
        aria-label="Add appointment"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-8 sm:right-8"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </Link>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function AppointmentList({ rows }: { rows: AppointmentRow[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/appointments/${row.id}`}
            className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">
                {formatDateTime(row.appointment_date)}
              </p>
              <p className="text-sm text-muted-foreground">
                {row.provider_name?.trim() || "Unnamed provider"}
                {row.provider_type?.trim()
                  ? ` · ${row.provider_type.trim()}`
                  : ""}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}
    >
      {APPOINTMENT_STATUS_LABELS[status]}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function formatDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const d = new Date(t);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
