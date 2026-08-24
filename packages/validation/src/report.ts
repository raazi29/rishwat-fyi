import { z } from "zod";
import { dateSchema, inrSchema, slugSchema, uuidSchema } from "./common.js";

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
    // Identify the service by EITHER its uuid (service_id) OR its public slug
    // (service_slug); exactly one is required (enforced by the refine below).
    // GET /services and GET /search expose the slug; GET /services/:slug also
    // exposes the uuid — so a client can submit with whichever it holds.
    service_id: uuidSchema.optional(),
    service_slug: slugSchema.optional(),
    state_id: uuidSchema,
    district_id: uuidSchema,
    office_id: uuidSchema.optional(),
    period_start: dateSchema,
    period_end: dateSchema,
    official_fee_reported_inr: inrSchema.optional(),
    additional_amount_reported_inr: inrSchema.optional(),
    amount_paid_inr: inrSchema.optional(),
    paid: z.boolean().default(false),
    delay_days: z.number().int().min(0).max(3650).optional(),
    visits: z.number().int().min(1).max(50).optional(),
    description: z.string().min(30).max(5000),
    // Cloudflare Turnstile CAPTCHA token. The web wizard attaches it on submit;
    // the API verifies it against Cloudflare only when TURNSTILE_SECRET_KEY is
    // set, and ignores it otherwise (dev/test). It lives in the SHARED schema on
    // purpose: the web server action re-parses the payload with this same schema
    // before forwarding it, and Zod strips unknown keys by default — so a token
    // absent from here would be silently dropped before ever reaching the API.
    turnstile_token: z.string().max(2048).optional(),
  })
  .refine((d) => (d.service_id === undefined) !== (d.service_slug === undefined), {
    message: "exactly one of service_id or service_slug is required",
    path: ["service_id"],
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
  )
  .refine((d) => d.paid === false || d.amount_paid_inr !== undefined || d.additional_amount_reported_inr !== undefined, {
    message: "paid reports should include an amount (amount_paid_inr or additional_amount_reported_inr)",
    path: ["amount_paid_inr"],
  })
  .refine((d) => !(d.paid === false && d.amount_paid_inr !== undefined), {
    message: "amount_paid_inr must not be set when paid is false",
    path: ["amount_paid_inr"],
  });

export const evidenceUploadSchema = z.object({
  report_id: uuidSchema,
  mime_type: z.string().max(100),
  size_bytes: z.number().int().min(1).max(20 * 1024 * 1024),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
