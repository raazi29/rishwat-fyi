import { z } from "zod";
import { emailSchema } from "./common.js";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
});

export const createModeratorSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["moderator", "admin"]).default("moderator"),
});
