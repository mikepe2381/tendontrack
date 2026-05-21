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

// Standard medical convention: day 0–6 = Week 1, day 7–13 = Week 2, …
// We clamp to a minimum of 1 so that a same-day anchor still reads "Week 1"
// (and so the UI never has to render "Week 0" or negative weeks).
export function weeksSince(anchorIso: string, timeZone: string): number {
  const today = todayInTimezone(timeZone);
  const days = daysBetween(anchorIso, today);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
