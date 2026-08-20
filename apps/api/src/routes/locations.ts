import { cities, departments, districts, states } from "@rishwat/database";
import { uuidSchema } from "@rishwat/validation";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { badRequest, notFound } from "../errors.js";
import { standardRateLimit } from "../middleware/rate-limit.js";

export const locations = new Hono<AppEnv>();

// General read throughput cap (no-op under tests).
locations.use("*", standardRateLimit);

// GET /states — the full state list, alphabetical.
locations.get("/states", async (c) => {
  const rows = await c
    .get("db")
    .select({ id: states.id, code: states.code, name: states.name })
    .from(states)
    .orderBy(asc(states.name));
  return c.json({ items: rows });
});

// GET /states/:code/districts — districts within a state, looked up by ISO code
// (case-insensitive). 404 when the state code is unknown.
locations.get("/states/:code/districts", async (c) => {
  const db = c.get("db");
  const code = c.req.param("code").toUpperCase();
  const [state] = await db
    .select({ id: states.id, code: states.code, name: states.name })
    .from(states)
    .where(eq(states.code, code))
    .limit(1);
  if (!state) throw notFound(`State not found: ${code}`);

  const rows = await db
    .select({ id: districts.id, code: districts.code, name: districts.name })
    .from(districts)
    .where(eq(districts.state_id, state.id))
    .orderBy(asc(districts.name));
  return c.json({ state, items: rows });
});

// GET /districts/:districtId/cities — cities within a district.
locations.get("/districts/:districtId/cities", async (c) => {
  const parsed = uuidSchema.safeParse(c.req.param("districtId"));
  if (!parsed.success) throw badRequest("Invalid districtId");

  const rows = await c
    .get("db")
    .select({ id: cities.id, name: cities.name })
    .from(cities)
    .where(eq(cities.district_id, parsed.data))
    .orderBy(asc(cities.name));
  return c.json({ items: rows });
});

// GET /departments — the department catalog.
locations.get("/departments", async (c) => {
  const rows = await c
    .get("db")
    .select({
      id: departments.id,
      slug: departments.slug,
      name: departments.name,
      category: departments.category,
    })
    .from(departments)
    .orderBy(asc(departments.name));
  return c.json({ items: rows });
});
