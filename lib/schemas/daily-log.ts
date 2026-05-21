import { z } from "zod";

import { todayInTimezone } from "@/lib/dates";

export const MOBILITY_STATUSES = [
  "nwb_cast",
  "nwb_boot",
  "pwb_boot",
  "fwb_boot",
  "fwb_shoe",
  "unrestricted",
] as const;

export type MobilityStatus = (typeof MOBILITY_STATUSES)[number];

export const MOBILITY_LABELS: Record<MobilityStatus, string> = {
  nwb_cast: "Non-weight bearing (cast)",
  nwb_boot: "Non-weight bearing (boot)",
  pwb_boot: "Partial weight bearing (boot)",
  fwb_boot: "Full weight bearing (boot)",
  fwb_shoe: "Full weight bearing (shoe)",
  unrestricted: "Unrestricted",
};

export const MOBILITY_SHORT_LABELS: Record<MobilityStatus, string> = {
  nwb_cast: "NWB cast",
  nwb_boot: "NWB boot",
  pwb_boot: "PWB boot",
  fwb_boot: "FWB boot",
  fwb_shoe: "FWB shoe",
  unrestricted: "Unrestricted",
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Enter a valid date");

export const supplementCheckSchema = z.object({
  supplement_id: z.string().uuid(),
  taken: z.boolean(),
});

export type SupplementCheck = z.infer<typeof supplementCheckSchema>;

// Schema is kept input==output so react-hook-form's TFieldValues stays in
// sync with what the resolver emits. The form normalizes HTML strings to
// numbers via setValueAs on register(), and Controller-driven inputs (sliders,
// mobility, ratings) always emit numbers / undefined.
export const dailyLogFormSchema = z.object({
  log_date: isoDate,
  pain_level: z
    .number()
    .int("Pain must be a whole number")
    .min(0)
    .max(10)
    .optional(),
  swelling_level: z
    .number()
    .int("Swelling must be a whole number")
    .min(0)
    .max(10)
    .optional(),
  sleep_hours: z
    .number()
    .min(0, "Sleep can't be negative")
    .max(24, "Sleep can't exceed 24 hours")
    .optional(),
  sleep_quality: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  mobility_status: z.enum(MOBILITY_STATUSES).optional(),
  notes: z.string().max(2000, "Notes can't exceed 2000 characters").optional(),
  flagged_for_followup: z.boolean(),
  supplements: z.array(supplementCheckSchema).max(200),
});

export type DailyLogFormValues = z.infer<typeof dailyLogFormSchema>;

// Date-validation rigor matching the onboarding wizard: log_date must not be
// in the future (per the user's timezone) and must not predate their injury.
export function validateLogDateAgainstProfile(
  logDate: string,
  injuryDate: string,
  timezone: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) return "Use YYYY-MM-DD format";
  if (Number.isNaN(Date.parse(logDate))) return "Enter a valid date";
  const today = todayInTimezone(timezone || "UTC");
  if (logDate > today) return "Log date can't be in the future";
  if (logDate < injuryDate) return "Log date can't be before your injury date";
  return null;
}
