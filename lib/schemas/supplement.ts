import { z } from "zod";

export const SUPPLEMENT_TIMINGS = [
  "morning",
  "midday",
  "evening",
  "bedtime",
  "as_needed",
] as const;

export type SupplementTiming = (typeof SUPPLEMENT_TIMINGS)[number];

export const SUPPLEMENT_TIMING_LABELS: Record<SupplementTiming, string> = {
  morning: "Morning",
  midday: "Midday",
  evening: "Evening",
  bedtime: "Bedtime",
  as_needed: "As needed",
};

// Schema is kept input==output for RHF compatibility. The client form
// normalizes empty-string HTML values to undefined via setValueAs on register.
export const supplementFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(120, "Name can't exceed 120 characters"),
  dose: z.string().max(60, "Dose can't exceed 60 characters").optional(),
  timing: z.enum(SUPPLEMENT_TIMINGS).optional(),
  notes: z.string().max(500, "Notes can't exceed 500 characters").optional(),
  active: z.boolean(),
});

export type SupplementFormValues = z.infer<typeof supplementFormSchema>;

export const supplementReorderSchema = z.array(z.string().uuid()).max(200);
