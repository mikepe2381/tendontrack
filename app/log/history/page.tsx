import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireOnboardedProfile } from "@/lib/auth/gates";
import {
  MOBILITY_SHORT_LABELS,
  type MobilityStatus,
} from "@/lib/schemas/daily-log";
import { cn } from "@/lib/utils";

type LogRow = {
  log_date: string;
  pain_level: number | null;
  swelling_level: number | null;
  mobility_status: MobilityStatus | null;
  flagged_for_followup: boolean;
};

function formatDate(iso: string): string {
  // Avoid Date() which would shift by timezone on YYYY-MM-DD parse.
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const monthIdx = Number(m) - 1;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[monthIdx] ?? m} ${Number(d)}, ${y}`;
}

export default async function LogHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ flagged?: string | string[] }>;
}) {
  const { supabase, user } = await requireOnboardedProfile();
  const params = await searchParams;
  const flaggedParam = Array.isArray(params.flagged)
    ? params.flagged[0]
    : params.flagged;
  const flaggedOnly = flaggedParam === "1" || flaggedParam === "true";

  let query = supabase
    .from("daily_logs")
    .select(
      "log_date, pain_level, swelling_level, mobility_status, flagged_for_followup",
    )
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(200);
  if (flaggedOnly) query = query.eq("flagged_for_followup", true);

  const { data, error } = await query;
  const logs: LogRow[] = error ? [] : ((data ?? []) as LogRow[]);

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Daily logs</p>
          <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/log">New log</Link>
        </Button>
      </header>

      <div className="flex items-center gap-2">
        <Button
          asChild
          size="sm"
          variant={flaggedOnly ? "ghost" : "secondary"}
        >
          <Link href="/log/history">All</Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant={flaggedOnly ? "secondary" : "ghost"}
        >
          <Link href="/log/history?flagged=1">Flagged only</Link>
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Couldn&apos;t load your logs: {error.message}
        </p>
      ) : null}

      {logs.length === 0 ? (
        <div className="rounded-md border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          {flaggedOnly
            ? "No flagged logs yet."
            : "No logs yet — tap “New log” to start."}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {logs.map((log) => (
            <li key={log.log_date}>
              <Link
                href={`/log?date=${log.log_date}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="space-y-1">
                  <p className="font-medium">{formatDate(log.log_date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.mobility_status
                      ? MOBILITY_SHORT_LABELS[log.mobility_status]
                      : "Mobility not set"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Metric label="Pain" value={log.pain_level} />
                  <Metric label="Swell" value={log.swelling_level} />
                  {log.flagged_for_followup ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
                      )}
                    >
                      Flagged
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="tabular-nums font-semibold">
        {value === null ? "—" : value}
      </span>
    </span>
  );
}
