import { z } from "zod";
import { dateSchema } from "./common.js";

export const governmentSourceSchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().min(3).max(300),
  department: z.string().max(200).optional(),
  publication_date: dateSchema.optional(),
  last_verified_at: z.string().datetime().optional(),
});
