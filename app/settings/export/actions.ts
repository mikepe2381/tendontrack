"use server";

import { requireOnboardedProfile } from "@/lib/auth/gates";

export type ExportTable =
  | "profile"
  | "milestones"
  | "daily_logs"
  | "supplements"
  | "supplement_logs"
  | "appointments"
  | "notes";

export type ExportPayload = {
  exported_at: string;
  user_id: string;
  profile: Record<string, unknown> | null;
  milestones: Record<string, unknown>[];
  daily_logs: Record<string, unknown>[];
  supplements: Record<string, unknown>[];
  supplement_logs: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  notes: Record<string, unknown>[];
};

export type ExportResult =
  | { ok: true; data: ExportPayload }
  | { ok: false; error: string };

export type TableExportResult =
  | { ok: true; rows: Record<string, unknown>[] }
  | { ok: false; error: string };

type FetchUserDataResult =
  | { error: string }
  | {
      profile: Record<string, unknown> | null;
      milestones: Record<string, unknown>[];
      daily_logs: Record<string, unknown>[];
      supplements: Record<string, unknown>[];
      supplement_logs: Record<string, unknown>[];
      appointments: Record<string, unknown>[];
      notes: Record<string, unknown>[];
    };

async function fetchUserData(userId: string): Promise<FetchUserDataResult> {
  const { supabase } = await requireOnboardedProfile();

  const [
    profileRes,
    milestonesRes,
    dailyLogsRes,
    supplementsRes,
    supplementLogsRes,
    appointmentsRes,
    notesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("milestones")
      .select("*")
      .eq("user_id", userId)
      .order("expected_week_min", { ascending: true }),
    supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: true }),
    supabase
      .from("supplements")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: true }),
    supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("appointment_date", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  const firstError =
    profileRes.error ||
    milestonesRes.error ||
    dailyLogsRes.error ||
    supplementsRes.error ||
    supplementLogsRes.error ||
    appointmentsRes.error ||
    notesRes.error;
  if (firstError) {
    return { error: firstError.message };
  }

  return {
    profile: (profileRes.data ?? null) as Record<string, unknown> | null,
    milestones: (milestonesRes.data ?? []) as Record<string, unknown>[],
    daily_logs: (dailyLogsRes.data ?? []) as Record<string, unknown>[],
    supplements: (supplementsRes.data ?? []) as Record<string, unknown>[],
    supplement_logs: (supplementLogsRes.data ?? []) as Record<string, unknown>[],
    appointments: (appointmentsRes.data ?? []) as Record<string, unknown>[],
    notes: (notesRes.data ?? []) as Record<string, unknown>[],
  };
}

export async function exportAllAsJson(): Promise<ExportResult> {
  const { user } = await requireOnboardedProfile();
  const result = await fetchUserData(user.id);
  if ("error" in result) return { ok: false, error: result.error };

  const payload: ExportPayload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    profile: result.profile,
    milestones: result.milestones,
    daily_logs: result.daily_logs,
    supplements: result.supplements,
    supplement_logs: result.supplement_logs,
    appointments: result.appointments,
    notes: result.notes,
  };
  return { ok: true, data: payload };
}

export async function exportTableAsRows(
  table: ExportTable,
): Promise<TableExportResult> {
  const { user } = await requireOnboardedProfile();
  const result = await fetchUserData(user.id);
  if ("error" in result) return { ok: false, error: result.error };

  if (table === "profile") {
    return { ok: true, rows: result.profile ? [result.profile] : [] };
  }
  return { ok: true, rows: result[table] };
}
