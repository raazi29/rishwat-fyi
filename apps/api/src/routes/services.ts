import {
  departments,
  governmentSources,
  services as servicesTable,
} from "@rishwat/database";
import { serviceQuerySchema, slugSchema } from "@rishwat/validation";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../env.js";
import { badRequest, notFound } from "../errors.js";
import { standardRateLimit } from "../middleware/rate-limit.js";
import { serviceAggregates } from "../services/aggregates.service.js";
import { searchServices } from "../services/search.service.js";

export const services = new Hono<AppEnv>();

// General read throughput cap (no-op under tests).
services.use("*", standardRateLimit);

const PUBLISHED_NOTICE =
  "Citizen figures are aggregated from independently submitted reports and " +
  "reflect self-reported experiences, not official policy. Compare against the " +
  "cited official sources.";
const INSUFFICIENT_NOTICE =
  "Not enough independent reports to publish citizen statistics for this " +
  "service yet (a minimum threshold of distinct reports is required).";

type SourceRow = typeof governmentSources.$inferSelect;

const formatSource = (s: SourceRow | undefined) =>
  s
    ? {
        url: s.url,
        title: s.title,
        department: s.department,
        publication_date: s.publication_date,
        last_verified_at: s.last_verified_at,
        retrieved_at: s.retrieved_at,
      }
    : null;

// GET / — filterable list of services, powered by the same engine as /search.
services.get("/", async (c) => {
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

// GET /:slug — full service detail: official figures + their government sources,
// plus the aggregated citizen experience block and a methodology notice.
services.get("/:slug", async (c) => {
  const db = c.get("db");
  const slugParsed = slugSchema.safeParse(c.req.param("slug"));
  if (!slugParsed.success) throw badRequest("Invalid slug");

  const [row] = await db
    .select({
      id: servicesTable.id,
      slug: servicesTable.slug,
      name: servicesTable.name,
      description: servicesTable.description,
      official_fee_inr: servicesTable.official_fee_inr,
      official_timeline_days: servicesTable.official_timeline_days,
      official_visits: servicesTable.official_visits,
      official_documents: servicesTable.official_documents,
      process_steps: servicesTable.process_steps,
      fee_source_id: servicesTable.official_fee_source_id,
      timeline_source_id: servicesTable.official_timeline_source_id,
      department_slug: departments.slug,
      department_name: departments.name,
    })
    .from(servicesTable)
    .innerJoin(departments, eq(departments.id, servicesTable.department_id))
    .where(eq(servicesTable.slug, slugParsed.data))
    .limit(1);

  if (!row) throw notFound(`Service not found: ${slugParsed.data}`);

  // Resolve the government sources backing the official numbers (traceability).
  const sourceIds = [row.fee_source_id, row.timeline_source_id].filter(
    (id): id is string => id !== null,
  );
  const sourceRows = sourceIds.length
    ? await db
        .select()
        .from(governmentSources)
        .where(inArray(governmentSources.id, sourceIds))
    : [];
  const sourceById = new Map(sourceRows.map((s) => [s.id, s]));

  const citizen = await serviceAggregates(db, row.id);

  return c.json({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    department: { slug: row.department_slug, name: row.department_name },
    official: {
      fee_inr: row.official_fee_inr,
      timeline_days: row.official_timeline_days,
      visits: row.official_visits,
      documents: row.official_documents ?? [],
      process_steps: row.process_steps ?? [],
    },
    sources: {
      fee: formatSource(row.fee_source_id ? sourceById.get(row.fee_source_id) : undefined),
      timeline: formatSource(
        row.timeline_source_id ? sourceById.get(row.timeline_source_id) : undefined,
      ),
    },
    citizen,
    notice: citizen.published ? PUBLISHED_NOTICE : INSUFFICIENT_NOTICE,
  });
});
