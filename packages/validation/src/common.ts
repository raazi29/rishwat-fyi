import { z } from "zod";

export const slugSchema = z.string().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const uuidSchema = z.string().uuid();
export const publicIdSchema = z.string().regex(/^R-[a-z0-9]{8}$/);
export const pageSchema = z.coerce.number().int().min(1).default(1);
export const perPageSchema = z.coerce.number().int().min(1).max(100).default(20);
export const inrSchema = z.number().min(0).max(10_000_000).multipleOf(0.01);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const emailSchema = z.string().email().max(254);
