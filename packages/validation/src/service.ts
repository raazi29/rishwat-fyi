import { z } from "zod";
import { pageSchema, perPageSchema, slugSchema } from "./common.js";

export const serviceQuerySchema = z.object({
  q: z.string().max(200).optional(),
  department: slugSchema.optional(),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  page: pageSchema,
  per_page: perPageSchema,
});

export const serviceDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  required: z.boolean(),
});

export const serviceProcessStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
});
