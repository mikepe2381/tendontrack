const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: string): boolean {
  return ISO_DATE.test(s);
}

export function todayInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function utcMidnight(isoDate: string): number {
  // Parse YYYY-MM-DD as UTC midnight to avoid local-time DST quirks when
  // computing day deltas. We only ever compare two dates derived this way.
  return Date.parse(`${isoDate}T00:00:00Z`);
}

export function daysBetween(startIso: string, endIso: string): number {
  const ms = utcMidnight(endIso) - utcMidnight(startIso);
  return Math.floor(ms / 86_400_000);
}

export function weeksSince(anchorIso: string, timeZone: string): number {
  const today = todayInTimezone(timeZone);
  return Math.floor(daysBetween(anchorIso, today) / 7);
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
