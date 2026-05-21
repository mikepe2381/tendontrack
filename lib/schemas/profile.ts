import { z } from "zod";

export const TREATMENT_TYPES = ["surgical", "non_surgical"] as const;
export const AFFECTED_SIDES = ["left", "right", "both"] as const;

export type TreatmentType = (typeof TREATMENT_TYPES)[number];
export type AffectedSide = (typeof AFFECTED_SIDES)[number];

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

export const profileFormSchema = z
  .object({
    treatment_type: z.enum(TREATMENT_TYPES, {
      required_error: "Choose a treatment type",
    }),
    injury_date: isoDate,
    surgery_date: isoDate.optional().or(z.literal("")),
    affected_side: z.enum(AFFECTED_SIDES, {
      required_error: "Choose an affected side",
    }),
    timezone: z.string().min(1).default("UTC"),
  })
  .superRefine((data, ctx) => {
    if (data.treatment_type === "surgical") {
      if (!data.surgery_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["surgery_date"],
          message: "Surgery date is required for surgical treatment",
        });
        return;
      }
    }
    if (data.surgery_date) {
      if (new Date(data.surgery_date) < new Date(data.injury_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["surgery_date"],
          message: "Surgery date must be on or after the injury date",
        });
      }
    }
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    if (new Date(data.injury_date) > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["injury_date"],
        message: "Injury date can't be in the future",
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
