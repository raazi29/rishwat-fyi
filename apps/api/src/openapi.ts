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
      license: { name: "Open data — see docs/governance.md" },
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: "system", description: "Health and metadata" },
      { name: "catalog", description: "Services and search" },
      { name: "locations", description: "States, districts, departments" },
      { name: "reports", description: "Citizen report submission and views" },
      { name: "evidence", description: "Supporting evidence" },
      { name: "datasets", description: "Open, PII-redacted dataset exports" },
      { name: "admin", description: "Moderation and operations (authenticated)" },
    ],
    paths: {
      "/health": op("get", "Liveness and database connectivity probe", "system"),
      "/services": op("get", "List and filter services (report counts included)", "catalog"),
      "/services/{slug}": op("get", "Service detail: official figures + citizen stats", "catalog"),
      "/search": op("get", "Full-text / fuzzy service search", "catalog"),
      "/locations/states": op("get", "List all states", "locations"),
      "/locations/states/{code}/districts": op("get", "Districts within a state", "locations"),
      "/locations/departments": op("get", "List departments", "locations"),
      "/reports": op("post", "Submit a citizen report", "reports"),
      "/reports/{publicId}": op("get", "Public, shareable report view (redacted)", "reports"),
      "/reports/{publicId}/status": op("get", "Submitter-only status check via token", "reports"),
      "/evidence": op("post", "Upload evidence (multipart/form-data)", "evidence"),
      "/evidence/{id}": op("get", "Evidence metadata (never the bytes)", "evidence"),
      "/datasets": op("get", "Dataset index with download links", "datasets"),
      "/datasets/reports.json": op("get", "Publishable reports as JSON", "datasets"),
      "/datasets/reports.csv": op("get", "Publishable reports as CSV", "datasets"),
      "/admin/auth/login": op("post", "Exchange credentials for a Bearer JWT", "admin"),
      "/admin/moderation/queue": op("get", "Paginated moderation triage queue", "admin", true),
      "/admin/moderation/decide": op("post", "Apply a moderation decision", "admin", true),
      "/admin/moderation/evidence/review": op("post", "Accept or reject evidence", "admin", true),
      "/admin/stats/overview": op("get", "Report/evidence/staff counts and rates", "admin", true),
      "/admin/stats/duplicates": op("get", "Near-duplicate report groups", "admin", true),
      "/admin/stats/clusters": op("get", "Coordinated abuse clusters (admin only)", "admin", true),
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
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
