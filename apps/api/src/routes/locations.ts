import { cities, departments, districts, states } from "@rishwat/database";
import { uuidSchema } from "@rishwat/validation";
import { asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { badRequest, notFound } from "../errors.js";
import { standardRateLimit } from "../middleware/rate-limit.js";
import { execRows } from "../utils/sql.js";

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

// Row shapes for the raw office queries. `lat`/`lon` are ST_Y/ST_X of the point
// (both NULL when the office has no location); they are folded into a
// { lat, lon } | null object so raw PostGIS binary never reaches the client.
interface OfficeListRow {
  id: string;
  name: string;
  address: string | null;
  service_slug: string;
  service_name: string;
  lat: number | null;
  lon: number | null;
}

interface OfficeDetailRow extends OfficeListRow {
  state_code: string;
  state_name: string;
  district_code: string | null;
  district_name: string | null;
}

const toLocation = (lat: number | null, lon: number | null): { lat: number; lon: number } | null =>
  lat === null || lon === null ? null : { lat, lon };

// GET /districts/:districtId/offices — offices located in a district, optionally
// narrowed to one service via ?service=<slug>. A 404 means the district itself
// is unknown; a known district with no offices returns 200 with an empty list.
// All user input is bound (never interpolated); ST_Y/ST_X yield NULL — not an
// error — for offices with no stored point.
locations.get("/districts/:districtId/offices", async (c) => {
  const parsed = uuidSchema.safeParse(c.req.param("districtId"));
  if (!parsed.success) throw badRequest("Invalid districtId");
  const districtId = parsed.data;
  const db = c.get("db");

  const [district] = await db
    .select({ id: districts.id })
    .from(districts)
    .where(eq(districts.id, districtId))
    .limit(1);
  if (!district) throw notFound(`District not found: ${districtId}`);

  const serviceSlug = c.req.query("service");
  const rows = await execRows<OfficeListRow>(
    db,
    sql`
      select
        o.id::text       as id,
        o.name           as name,
        o.address        as address,
        s.slug           as service_slug,
        s.name           as service_name,
        ST_Y(o.location) as lat,
        ST_X(o.location) as lon
      from offices o
      join services s on s.id = o.service_id
      where o.district_id = ${districtId}
        ${serviceSlug ? sql`and s.slug = ${serviceSlug}` : sql``}
      order by o.name asc, s.name asc
    `,
  );

  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    service: { slug: r.service_slug, name: r.service_name },
    location: toLocation(r.lat, r.lon),
  }));
  return c.json({ items });
});

// GET /offices/:id — a single office joined to its service, state and district
// names. 404 when the id is unknown. district_id is nullable, so the district
// is LEFT JOINed and reported as null when absent.
locations.get("/offices/:id", async (c) => {
  const parsed = uuidSchema.safeParse(c.req.param("id"));
  if (!parsed.success) throw badRequest("Invalid office id");
  const db = c.get("db");

  const [row] = await execRows<OfficeDetailRow>(
    db,
    sql`
      select
        o.id::text       as id,
        o.name           as name,
        o.address        as address,
        s.slug           as service_slug,
        s.name           as service_name,
        st.code          as state_code,
        st.name          as state_name,
        d.code           as district_code,
        d.name           as district_name,
        ST_Y(o.location) as lat,
        ST_X(o.location) as lon
      from offices o
      join services s on s.id = o.service_id
      join states st on st.id = o.state_id
      left join districts d on d.id = o.district_id
      where o.id = ${parsed.data}
      limit 1
    `,
  );
  if (!row) throw notFound(`Office not found: ${parsed.data}`);

  return c.json({
    id: row.id,
    name: row.name,
    address: row.address,
    service: { slug: row.service_slug, name: row.service_name },
    state: { code: row.state_code, name: row.state_name },
    district: row.district_code ? { code: row.district_code, name: row.district_name } : null,
    location: toLocation(row.lat, row.lon),
  });
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
