import { z } from "zod";
import { pageSchema, perPageSchema, publicIdSchema, uuidSchema } from "./common.js";
import { reportStatusSchema } from "./report.js";

export const moderationDecisionSchema = z
  .object({
    public_id: publicIdSchema,
    action: z.enum(["mark_validated", "reject", "acknowledge_officially", "withdraw"]),
    reason: z.string().max(1000).optional(),
    source_url: z.string().url().max(2048).optional(),
  })
  .refine((d) => d.action !== "acknowledge_officially" || d.source_url, {
    message: "source_url is required when acknowledging officially",
    path: ["source_url"],
  });

export const evidenceReviewSchema = z.object({
  evidence_id: uuidSchema,
  status: z.enum(["accepted", "rejected"]),
  reason: z.string().max(1000).optional(),
});

export const moderationQueueQuerySchema = z.object({
  status: reportStatusSchema.optional(),
  page: pageSchema,
  per_page: perPageSchema,
});
