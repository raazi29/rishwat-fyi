import { z } from "zod";
import { dateSchema, inrSchema, uuidSchema } from "./common.js";

export const reportStatusSchema = z.enum([
  "submitted",
  "validated",
  "corroborated",
  "evidence_backed",
  "officially_acknowledged",
  "rejected",
  "withdrawn",
]);

export const reportSubmissionSchema = z
  .object({
    service_id: uuidSchema,
    state_id: uuidSchema,
    district_id: uuidSchema,
    office_id: uuidSchema.optional(),
    period_start: dateSchema,
    period_end: dateSchema,
    official_fee_reported_inr: inrSchema.optional(),
    additional_amount_reported_inr: inrSchema.optional(),
    amount_paid_inr: inrSchema.optional(),
    paid: z.boolean().default(false),
    delay_days: z.number().int().min(0).optional(),
    visits: z.number().int().min(1).optional(),
    description: z.string().min(30).max(5000),
  })
  .refine((d) => d.period_end >= d.period_start, {
    message: "period_end must be >= period_start",
    path: ["period_end"],
  })
  .refine(
    (d) =>
      [
        d.additional_amount_reported_inr,
        d.amount_paid_inr,
        d.delay_days,
        d.visits,
        d.description,
      ].some((v) => v !== undefined),
    { message: "at least one experience field is required" },
  );

export const evidenceUploadSchema = z.object({
  report_id: uuidSchema,
  mime_type: z.string().max(100),
  size_bytes: z.number().int().min(1).max(20 * 1024 * 1024),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
