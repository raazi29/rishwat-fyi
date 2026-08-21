import { Hono } from "hono";
import type { AppEnv } from "./env.js";

export const openapi = new Hono<AppEnv>();

type Method = "get" | "post";

// Compact single-operation path entry. `secured` adds the Bearer requirement.
function op(method: Method, summary: string, tag: string, secured = false) {
  const operation: Record<string, unknown> = {
    summary,
    tags: [tag],
    responses: { "200": { description: "OK" } },
  };
  if (secured) operation.security = [{ bearerAuth: [] }];
  return { [method]: operation };
}

// A `content` block referencing a named component schema (application/json).
function jsonContent(ref: string): Record<string, unknown> {
  return { content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } } };
}

function buildSpec(baseUrl: string): Record<string, unknown> {
  return {
    openapi: "3.0.3",
    info: {
      title: "Rishwat.fyi API",
      version: "0.1.0",
      description:
        "Open government-transparency API. Public endpoints expose the service " +
        "catalog, citizen reports and the aggregated open dataset; admin endpoints " +
        "(Bearer JWT) drive moderation and operational stats.",
      license: { name: "Data: CC BY 4.0 (see LICENSE-DATA). Code: MIT (see LICENSE)." },
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "system", description: "Health and metadata" },
      { name: "catalog", description: "Services and search" },
      { name: "locations", description: "States, districts, offices, departments" },
      { name: "reports", description: "Citizen report submission and views" },
      { name: "evidence", description: "Supporting evidence" },
      { name: "datasets", description: "Open, PII-redacted dataset exports" },
      { name: "admin", description: "Moderation and operations (authenticated)" },
    ],
    paths: {
      "/health": {
        get: {
          summary: "Liveness + database/storage dependency probe",
          tags: ["system"],
          responses: {
            "200": { description: "Healthy — database reachable", ...jsonContent("HealthStatus") },
            "503": {
              description: "Degraded — a hard dependency (the database) is down",
              ...jsonContent("HealthStatus"),
            },
          },
        },
      },
      "/services": {
        get: {
          summary: "List and filter services (report counts included)",
          tags: ["catalog"],
          responses: { "200": { description: "OK", ...jsonContent("ServiceList") } },
        },
      },
      "/services/{slug}": {
        get: {
          summary: "Service detail: official figures + citizen stats",
          tags: ["catalog"],
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "OK", ...jsonContent("ServiceDetail") },
            "404": { description: "Service not found" },
          },
        },
      },
      "/search": {
        get: {
          summary: "Full-text / fuzzy service search",
          tags: ["catalog"],
          responses: { "200": { description: "OK", ...jsonContent("ServiceList") } },
        },
      },
      "/locations/states": op("get", "List all states", "locations"),
      "/locations/states/{code}/districts": op("get", "Districts within a state", "locations"),
      "/locations/districts/{districtId}/cities": op("get", "Cities within a district", "locations"),
      "/locations/districts/{districtId}/offices": op(
        "get",
        "Offices in a district (optional ?service=<slug> filter)",
        "locations",
      ),
      "/locations/offices/{id}": op("get", "Office detail with service, state and district names", "locations"),
      "/locations/departments": op("get", "List departments", "locations"),
      "/reports": {
        post: {
          summary: "Submit a citizen report",
          tags: ["reports"],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ReportSubmission" } } },
          },
          responses: {
            "201": { description: "Created", ...jsonContent("ReportSubmissionResponse") },
            "400": { description: "Validation failed or an unresolvable reference" },
          },
        },
      },
      "/reports/{publicId}": op("get", "Public, shareable report view (redacted)", "reports"),
      "/reports/{publicId}/status": op("get", "Submitter-only status check via token", "reports"),
      "/evidence": op(
        "post",
        "Upload evidence (multipart/form-data). Requires the submitter's public_id "
          + "and one-time token; a wrong token returns 404.",
        "evidence",
      ),
      "/evidence/{id}": op("get", "Evidence metadata (never the bytes)", "evidence"),
      "/datasets": op("get", "Dataset index with download links", "datasets"),
      "/datasets/reports.json": op("get", "Publishable reports as JSON", "datasets"),
      "/datasets/reports.csv": op("get", "Publishable reports as CSV", "datasets"),
      "/admin/auth/login": op("post", "Exchange credentials for a Bearer JWT", "admin"),
      "/admin/queue": op("get", "Paginated moderation triage queue", "admin", true),
      "/admin/reports/decide": op("post", "Apply a moderation decision", "admin", true),
      "/admin/evidence/review": op("post", "Accept or reject evidence", "admin", true),
      "/admin/stats/overview": op("get", "Report/evidence/staff counts and rates", "admin", true),
      "/admin/stats/duplicates": op("get", "Near-duplicate report groups", "admin", true),
      "/admin/stats/clusters": op("get", "Coordinated abuse clusters (admin only)", "admin", true),
      "/admin/jobs/corroborate": op("post", "Run the auto-corroboration promotion pass", "admin", true),
      "/admin/jobs/recompute-aggregates": op(
        "post",
        "Materialize public statistics into aggregate_metrics",
        "admin",
        true,
      ),
      "/admin/jobs/purge-evidence": op(
        "post",
        "Purge evidence past its retention window (storage + metadata)",
        "admin",
        true,
      ),
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        HealthStatus: {
          type: "object",
          required: ["status", "database", "storage", "time"],
          description:
            "Health probe result. HTTP 200 when status is \"ok\"; HTTP 503 when status is \"degraded\" " +
            "(the database is down). Storage is advisory and never changes status or the HTTP code.",
          properties: {
            status: {
              type: "string",
              enum: ["ok", "degraded"],
              description: "\"ok\" (HTTP 200) when healthy; \"degraded\" (HTTP 503) when the database is down.",
            },
            database: {
              type: "string",
              enum: ["up", "down"],
              description: "Result of a SELECT 1 round-trip. \"down\" is what drives the 503.",
            },
            storage: {
              type: "object",
              required: ["driver", "status"],
              description:
                "Evidence-storage backend health. Advisory only: a storage failure never forces a 503, " +
                "because reads and the public dataset do not depend on storage — only evidence upload does.",
              properties: {
                driver: { type: "string", enum: ["local", "supabase"] },
                status: {
                  type: "string",
                  enum: ["up", "down", "configured"],
                  description:
                    "local: up/down from a cheap fs.access check. supabase: static \"configured\" " +
                    "(no per-poll network call to object storage).",
                },
              },
            },
            time: { type: "string", format: "date-time" },
          },
        },
        ServiceListItem: {
          type: "object",
          required: ["id", "slug", "name", "department", "report_count"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Service UUID — pass as service_id when submitting a report.",
            },
            slug: {
              type: "string",
              description: "Public service slug — pass as service_slug when submitting a report.",
            },
            name: { type: "string" },
            department: { type: "string" },
            description: { type: "string", nullable: true },
            report_count: { type: "integer" },
          },
        },
        ServiceList: {
          type: "object",
          required: ["total", "items"],
          properties: {
            total: { type: "integer" },
            items: { type: "array", items: { $ref: "#/components/schemas/ServiceListItem" } },
          },
        },
        ServiceDetail: {
          type: "object",
          required: ["id", "slug", "name", "department", "official", "sources", "citizen", "notice"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Service UUID — pass as service_id when submitting a report.",
            },
            slug: {
              type: "string",
              description: "Public service slug — pass as service_slug when submitting a report.",
            },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            department: {
              type: "object",
              properties: { slug: { type: "string" }, name: { type: "string" } },
            },
            official: { type: "object", description: "Official fee/timeline/visits/documents/process_steps." },
            sources: { type: "object", description: "Government sources backing the official figures." },
            citizen: { type: "object", description: "Aggregated citizen-experience block (see methodology.md)." },
            notice: { type: "string" },
          },
        },
        ReportSubmission: {
          type: "object",
          description: "Citizen report submission. Provide EXACTLY ONE of service_id or service_slug.",
          required: ["state_id", "district_id", "period_start", "period_end", "description"],
          oneOf: [
            { required: ["service_id"], not: { required: ["service_slug"] } },
            { required: ["service_slug"], not: { required: ["service_id"] } },
          ],
          properties: {
            service_id: {
              type: "string",
              format: "uuid",
              description: "Service UUID (from GET /services or /services/:slug). Provide this OR service_slug.",
            },
            service_slug: {
              type: "string",
              description: "Service slug (from GET /services, /search or /services/:slug). Provide this OR service_id.",
            },
            state_id: { type: "string", format: "uuid" },
            district_id: { type: "string", format: "uuid" },
            office_id: { type: "string", format: "uuid", nullable: true },
            period_start: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            period_end: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            official_fee_reported_inr: { type: "number" },
            additional_amount_reported_inr: { type: "number" },
            amount_paid_inr: { type: "number" },
            paid: { type: "boolean", default: false },
            delay_days: { type: "integer" },
            visits: { type: "integer" },
            description: { type: "string", minLength: 30, maxLength: 5000 },
          },
        },
        ReportSubmissionResponse: {
          type: "object",
          required: ["public_id", "token", "status"],
          properties: {
            public_id: { type: "string", pattern: "^R-[a-z0-9]{8}$" },
            token: { type: "string", description: "One-time submission token; only its sha256 is stored." },
            status: { type: "string" },
          },
        },
      },
    },
  };
}

// GET /openapi.json — machine-readable OpenAPI 3.0 document.
openapi.get("/openapi.json", (c) => {
  const base = c.get("config").publicBaseUrl.replace(/\/$/, "");
  return c.json(buildSpec(base));
});

// GET / — human landing page linking to the spec and key resources.
openapi.get("/", (c) => {
  const base = c.get("config").publicBaseUrl.replace(/\/$/, "");
  const links: [string, string][] = [
    ["/openapi.json", "OpenAPI 3.0 specification"],
    ["/health", "Health probe"],
    ["/services", "Service catalog"],
    ["/search?q=passport", "Service search"],
    ["/datasets", "Open dataset index"],
    ["/datasets/reports.csv", "Dataset — CSV"],
    ["/datasets/reports.json", "Dataset — JSON"],
  ];
  const items = links
    .map(([path, label]) => `<li><a href="${base}${path}">${label}</a> <code>${path}</code></li>`)
    .join("\n      ");
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Rishwat.fyi API</title>
    <style>
      body { font: 16px/1.6 system-ui, sans-serif; max-width: 44rem; margin: 3rem auto; padding: 0 1rem; }
      h1 { margin-bottom: 0.25rem; } p.tag { color: #555; margin-top: 0; }
      li { margin: 0.35rem 0; } code { color: #666; font-size: 0.85em; }
    </style>
  </head>
  <body>
    <h1>Rishwat.fyi API</h1>
    <p class="tag">Government, as experienced by citizens.</p>
    <ul>
      ${items}
    </ul>
    <p>Documentation lives in the repository <code>docs/</code> directory.</p>
  </body>
</html>`;
  return c.html(html);
});
