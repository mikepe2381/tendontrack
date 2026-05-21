import { redirect } from "next/navigation";

import { DailyLogForm } from "@/app/log/daily-log-form";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import { isIsoDate, todayInTimezone } from "@/lib/dates";
import {
  validateLogDateAgainstProfile,
  type DailyLogFormValues,
  type MobilityStatus,
} from "@/lib/schemas/daily-log";
import type {
  SupplementTiming,
} from "@/lib/schemas/supplement";

type ExistingLog = {
  log_date: string;
  pain_level: number | null;
  swelling_level: number | null;
  sleep_hours: number | string | null;
  sleep_quality: number | null;
  mood: number | null;
  mobility_status: MobilityStatus | null;
  notes: string | null;
  flagged_for_followup: boolean;
};

type SupplementRow = {
  id: string;
  name: string;
  dose: string | null;
  timing: SupplementTiming | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

type SupplementLogRow = {
  supplement_id: string;
  taken: boolean;
};

export type SupplementFormItem = {
  id: string;
  name: string;
  dose: string | null;
  timing: SupplementTiming | null;
  active: boolean;
  inactiveHistorical: boolean;
};

export default async function LogPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  const { supabase, user, profile } = await requireOnboardedProfile();
  const params = await searchParams;
  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;

  const timezone = profile.timezone || "UTC";
  const today = todayInTimezone(timezone);

  // If a ?date is supplied, validate it server-side using the same rigor as
  // the onboarding wizard: must be a real ISO date, not in the future, not
  // before the user's injury date. Anything else falls back to today.
  let logDate = today;
  if (rawDate && isIsoDate(rawDate)) {
    const dateError = validateLogDateAgainstProfile(
      rawDate,
      profile.injury_date,
      timezone,
    );
    if (dateError) {
      redirect("/log");
    }
    logDate = rawDate;
  }

  const [{ data: existing }, { data: supplements }, { data: supplementLogs }] =
    await Promise.all([
      supabase
        .from("daily_logs")
        .select(
          "log_date, pain_level, swelling_level, sleep_hours, sleep_quality, mood, mobility_status, notes, flagged_for_followup",
        )
        .eq("user_id", user.id)
        .eq("log_date", logDate)
        .maybeSingle<ExistingLog>(),
      supabase
        .from("supplements")
        .select("id, name, dose, timing, active, sort_order, created_at")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("supplement_logs")
        .select("supplement_id, taken")
        .eq("user_id", user.id)
        .eq("log_date", logDate),
    ]);

  const supplementList: SupplementRow[] = (supplements ?? []) as SupplementRow[];
  const supplementLogList: SupplementLogRow[] =
    (supplementLogs ?? []) as SupplementLogRow[];
  const takenByIdMap = new Map(
    supplementLogList.map((r) => [r.supplement_id, r.taken]),
  );

  // Show active supplements plus any inactive ones that have a log entry for
  // this date — so historical context is preserved when editing past logs.
  const visibleSupplements: SupplementFormItem[] = supplementList
    .filter((s) => s.active || takenByIdMap.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      dose: s.dose,
      timing: s.timing,
      active: s.active,
      inactiveHistorical: !s.active && takenByIdMap.has(s.id),
    }));

  const defaultValues: DailyLogFormValues = {
    log_date: logDate,
    pain_level: existing?.pain_level ?? undefined,
    swelling_level: existing?.swelling_level ?? undefined,
    sleep_hours:
      existing?.sleep_hours === null || existing?.sleep_hours === undefined
        ? undefined
        : Number(existing.sleep_hours),
    sleep_quality: existing?.sleep_quality ?? undefined,
    mood: existing?.mood ?? undefined,
    mobility_status: existing?.mobility_status ?? undefined,
    notes: existing?.notes ?? undefined,
    flagged_for_followup: existing?.flagged_for_followup ?? false,
    supplements: visibleSupplements.map((s) => ({
      supplement_id: s.id,
      taken: takenByIdMap.get(s.id) ?? false,
    })),
  };

  const isEditing = Boolean(existing);
  const heading = logDate === today ? "Today's log" : `Log for ${logDate}`;

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Daily check-in</p>
        <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
        {logDate !== today ? (
          <p className="text-sm text-muted-foreground">
            Editing a past day. Change the date below if you meant a different
            one.
          </p>
        ) : null}
      </header>

      <DailyLogForm
        defaultValues={defaultValues}
        injuryDate={profile.injury_date}
        todayInTz={today}
        isEditing={isEditing}
        supplements={visibleSupplements}
      />
    </div>
  );
}
