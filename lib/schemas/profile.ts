import { z } from "zod";

export const TREATMENT_TYPES = ["surgical", "non_surgical"] as const;
export const AFFECTED_SIDES = ["left", "right", "both"] as const;

export type TreatmentType = (typeof TREATMENT_TYPES)[number];
export type AffectedSide = (typeof AFFECTED_SIDES)[number];

const MAX_PAST_YEARS = 5;

function endOfTodayUtcMs(): number {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

function earliestAllowedMs(): number {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - MAX_PAST_YEARS);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Enter a valid date");

// Field-level refinements so partial validation (form.trigger on a single
// field) still catches future / ancient dates, not just full-form submit.
const pastOrTodayDate = isoDate
  .refine(
    (s) => Date.parse(s) <= endOfTodayUtcMs(),
    "Date can't be in the future",
  )
  .refine(
    (s) => Date.parse(s) >= earliestAllowedMs(),
    `Date must be within the last ${MAX_PAST_YEARS} years`,
  );

export const profileFormSchema = z
  .object({
    treatment_type: z.enum(TREATMENT_TYPES, {
      required_error: "Choose a treatment type",
    }),
    injury_date: pastOrTodayDate,
    surgery_date: pastOrTodayDate.optional().or(z.literal("")),
    affected_side: z.enum(AFFECTED_SIDES, {
      required_error: "Choose an affected side",
    }),
    timezone: z.string().min(1).default("UTC"),
  })
  .superRefine((data, ctx) => {
    if (data.treatment_type === "surgical" && !data.surgery_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["surgery_date"],
        message: "Surgery date is required for surgical treatment",
      });
    }
    if (data.surgery_date && data.injury_date) {
      const surgery = Date.parse(data.surgery_date);
      const injury = Date.parse(data.injury_date);
      if (
        Number.isFinite(surgery) &&
        Number.isFinite(injury) &&
        surgery < injury
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["surgery_date"],
          message: "Surgery date must be on or after the injury date",
        });
      }
    }
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Settings page reuses every onboarding field and adds display_name. Same
// validation rules so the two surfaces stay in sync.
export const profileSettingsSchema = z
  .object({
    display_name: z
      .string()
      .max(80, "Display name can't exceed 80 characters")
      .optional()
      .or(z.literal("")),
    treatment_type: z.enum(TREATMENT_TYPES, {
      required_error: "Choose a treatment type",
    }),
    injury_date: pastOrTodayDate,
    surgery_date: pastOrTodayDate.optional().or(z.literal("")),
    affected_side: z.enum(AFFECTED_SIDES, {
      required_error: "Choose an affected side",
    }),
    timezone: z.string().min(1).default("UTC"),
  })
  .superRefine((data, ctx) => {
    if (data.treatment_type === "surgical" && !data.surgery_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["surgery_date"],
        message: "Surgery date is required for surgical treatment",
      });
    }
    if (data.surgery_date && data.injury_date) {
      const surgery = Date.parse(data.surgery_date);
      const injury = Date.parse(data.injury_date);
      if (
        Number.isFinite(surgery) &&
        Number.isFinite(injury) &&
        surgery < injury
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["surgery_date"],
          message: "Surgery date must be on or after the injury date",
        });
      }
    }
  });

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;
