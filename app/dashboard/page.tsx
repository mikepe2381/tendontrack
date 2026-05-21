import Link from "next/link";

import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import { todayInTimezone, weeksSince } from "@/lib/dates";
import type { AppointmentStatus } from "@/lib/schemas/appointment";
import { firstLine } from "@/lib/schemas/note";

const TREATMENT_LABEL: Record<string, string> = {
  surgical: "Surgical repair",
  non_surgical: "Non-surgical (conservative)",
};

type NextAppointment = {
  id: string;
  appointment_date: string;
  provider_name: string | null;
  provider_type: string | null;
  status: AppointmentStatus;
  prep_questions: string | null;
};

type DashboardNote = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireOnboardedProfile();

  const timezone = profile.timezone || "UTC";
  const anchorDate =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? profile.surgery_date
      : profile.injury_date;
  const anchorLabel =
    profile.treatment_type === "surgical" && profile.surgery_date
      ? "since surgery"
      : "since injury";
  const week = weeksSince(anchorDate, timezone);
  const displayName = profile.display_name?.trim() || user.email;

  const today = todayInTimezone(timezone);
  const { data: todaysLog } = await supabase
    .from("daily_logs")
    .select("log_date")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .maybeSingle<{ log_date: string }>();
  const hasLoggedToday = Boolean(todaysLog);

  const nowIso = new Date().toISOString();
  const { data: nextAppt } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, provider_name, provider_type, status, prep_questions",
    )
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .gte("appointment_date", nowIso)
    .order("appointment_date", { ascending: true })
    .limit(1)
    .maybeSingle<NextAppointment>();

  const { data: recentNotes } = await supabase
    .from("notes")
    .select("id, title, body, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);
  const notes: DashboardNote[] = (recentNotes ?? []) as DashboardNote[];

  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {displayName}
        </h1>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Daily check-in
        </p>
        <p className="mt-1 text-lg font-medium">
          {hasLoggedToday
            ? "You've logged today. Edit if anything's changed."
            : "How are you feeling today?"}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/log">
              {hasLoggedToday ? "Edit today's log" : "Log today"}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/log/history">View history</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Current week
          </p>
          <p className="mt-1 text-2xl font-semibold">Week {week}</p>
          <p className="mt-1 text-sm text-muted-foreground">{anchorLabel}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Treatment
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {TREATMENT_LABEL[profile.treatment_type] ?? profile.treatment_type}
          </p>
          {profile.affected_side ? (
            <p className="mt-1 text-sm text-muted-foreground capitalize">
              {profile.affected_side} side
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/timeline"
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Recovery
          </p>
          <p className="mt-1 text-lg font-medium">Timeline</p>
          <p className="mt-1 text-sm text-muted-foreground">
            See what&apos;s typical around week {week}.
          </p>
        </Link>
        <Link
          href="/reference"
          className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Reference
          </p>
          <p className="mt-1 text-lg font-medium">Clinical reference</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recovery milestones and supplement evidence.
          </p>
        </Link>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Next appointment
          </h2>
          <Link
            href="/appointments"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            All appointments
          </Link>
        </div>
        {nextAppt ? (
          <Link
            href={`/appointments/${nextAppt.id}`}
            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
          >
            <p className="text-sm font-medium">
              {formatDateTime(nextAppt.appointment_date)}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {nextAppt.provider_name?.trim() || "Unnamed provider"}
              {nextAppt.provider_type?.trim()
                ? ` · ${nextAppt.provider_type.trim()}`
                : ""}
            </p>
            {nextAppt.prep_questions?.trim() ? (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Questions
                </p>
                <MarkdownPreview source={nextAppt.prep_questions} />
              </div>
            ) : null}
          </Link>
        ) : (
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No upcoming appointments.{" "}
            <Link
              href="/appointments/new"
              className="underline-offset-4 hover:underline"
            >
              Add one
            </Link>
            .
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent notes
          </h2>
          <Link
            href="/notes"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            All notes
          </Link>
        </div>
        {notes.length === 0 ? (
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No notes yet.{" "}
            <Link
              href="/notes/new"
              className="underline-offset-4 hover:underline"
            >
              Write your first
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notes/${n.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <p className="font-medium">
                    {n.title?.trim() || "Untitled note"}
                  </p>
                  {firstLine(n.body) ? (
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {firstLine(n.body)}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
