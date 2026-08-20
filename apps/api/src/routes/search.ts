import { serviceQuerySchema } from "@rishwat/validation";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { badRequest } from "../errors.js";
import { standardRateLimit } from "../middleware/rate-limit.js";
import { searchServices } from "../services/search.service.js";

export const search = new Hono<AppEnv>();

// General read throughput cap (no-op under tests). Applied router-wide so it
// covers both the bare path and any subpaths reliably.
search.use("*", standardRateLimit);

// GET / — full-text / trigram search over the service catalog. Query params are
// validated with the shared zod schema (coercing page/per_page from strings);
// the response is the { total, items } shape returned by searchServices.
search.get("/", async (c) => {
  const parsed = serviceQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw badRequest("Invalid query parameters", parsed.error.flatten());
  }
  const { q, department, state, district, page, per_page } = parsed.data;
  const result = await searchServices(c.get("db"), q, {
    department,
    state,
    district,
    page,
    perPage: per_page,
  });
  return c.json(result);
});
