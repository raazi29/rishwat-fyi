import type { EndpointSpec } from "@/components/doc";

/**
 * Public API endpoint specifications, grouped for the reference page. Content
 * is transcribed from docs/api.md exactly — paths, parameters, and example
 * responses. No endpoints or fields are invented; example values match the
 * documented shapes (and reuse docs/api.md's own example values where given).
 */

export interface EndpointGroup {
  id: string;
  title: string;
  endpoints: EndpointSpec[];
}

const health: EndpointSpec = {
  id: "get-health",
  method: "GET",
  path: "/health",
  auth: "public",
  summary: "Liveness and database check. Runs SELECT 1. Returns 503 with database \"down\" if the database is unreachable.",
  response: `{ "status": "ok", "database": "up", "time": "2026-08-20T00:00:00.000Z" }`,
  responseLabel: "Response 200",
};

const search: EndpointSpec = {
  id: "get-search",
  method: "GET",
  path: "/search",
  auth: "public",
  rateLimit: "60 / min",
  summary:
    "Full-text search across services — matched against the search vector, name (ILIKE), and trigram similarity. Supports the same filters as GET /services.",
  params: [
    { name: "q", type: "string", notes: "≤ 200 chars; search term" },
    { name: "department", type: "string", notes: "department slug filter" },
    { name: "state", type: "string", notes: "state name filter" },
    { name: "district", type: "string", notes: "district name filter" },
    { name: "page", type: "int ≥ 1", notes: "default 1" },
    { name: "per_page", type: "int 1–100", notes: "default 20" },
  ],
  response: `{
  "total": 1,
  "items": [
    {
      "slug": "driving-licence",
      "name": "Driving Licence",
      "department": "Transport",
      "state": "Uttar Pradesh",
      "district": "Varanasi",
      "report_count": 284
    }
  ]
}`,
  responseLabel: "Response 200",
  note: "Invalid per_page (e.g. 1000) returns 400.",
};

const services: EndpointSpec = {
  id: "get-services",
  method: "GET",
  path: "/services",
  auth: "public",
  rateLimit: "60 / min",
  summary:
    "List services with the same query schema as /search. With no filters it returns all seeded services (12 at launch).",
  params: [
    { name: "q", type: "string", notes: "≤ 200 chars; search term" },
    { name: "department", type: "string", notes: "department slug filter" },
    { name: "state", type: "string", notes: "state name filter" },
    { name: "district", type: "string", notes: "district name filter" },
    { name: "page", type: "int ≥ 1", notes: "default 1" },
    { name: "per_page", type: "int 1–100", notes: "default 20" },
  ],
  response: `{
  "total": 1,
  "items": [
    {
      "slug": "driving-licence",
      "name": "Driving Licence",
      "department": "Transport",
      "description": "…"
    }
  ]
}`,
  responseLabel: "Response 200",
};

const serviceDetail: EndpointSpec = {
  id: "get-service-detail",
  method: "GET",
  path: "/services/:slug",
  auth: "public",
  rateLimit: "60 / min",
  summary:
    "Service detail: the official block, its government sources, the citizen-experience aggregates, and the standard notice.",
  params: [{ name: "slug", type: "string (path)", required: true, notes: "service slug" }],
  response: `{
  "service": {
    "slug": "driving-licence",
    "name": "Driving Licence",
    "department": "Transport",
    "description": "…",
    "official_fee_inr": "1000.00",
    "official_timeline_days": 7,
    "official_visits": 1,
    "official_documents": [ { "name": "…", "required": true } ],
    "process_steps": [ { "order": 1, "title": "…", "description": "…" } ]
  },
  "sources": {
    "fee": { "url": "…", "title": "…", "last_verified_at": "…" },
    "timeline": { "url": "…", "title": "…", "last_verified_at": "…" }
  },
  "citizen": {
    "published": true,
    "report_count": 4,
    "ip_bucket_count": 3,
    "extra_payment_median": "1500.00",
    "delay_median": 14,
    "visits_avg": 2.5,
    "corroboration_rate": 0.5,
    "recent_issues": ["additional_payment_requested", "multiple_visits"]
  },
  "notice": "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing."
}`,
  responseLabel: "Response 200",
  note:
    "The citizen block is published: true only with ≥ 3 reports from ≥ 2 distinct IP-hash buckets for the (service, district) cell; otherwise every statistic is null and published is false, while report_count still shows the true count. Unknown slug returns 404.",
};

const states: EndpointSpec = {
  id: "get-states",
  method: "GET",
  path: "/states",
  auth: "public",
  rateLimit: "60 / min",
  summary: "All states.",
  response: `[ { "id": "…", "code": "UP", "name": "Uttar Pradesh" } ]`,
  responseLabel: "Response 200",
};

const districts: EndpointSpec = {
  id: "get-districts",
  method: "GET",
  path: "/states/:code/districts",
  auth: "public",
  rateLimit: "60 / min",
  summary: "Districts of the state identified by its ISO 3166-2:IN code (e.g. UP).",
  params: [{ name: "code", type: "string (path)", required: true, notes: "ISO 3166-2:IN code, e.g. UP" }],
  response: `[ { "id": "…", "code": "UP01", "name": "Agra" } ]`,
  responseLabel: "Response 200",
  note: "Unknown code returns 404.",
};

const cities: EndpointSpec = {
  id: "get-cities",
  method: "GET",
  path: "/districts/:districtId/cities",
  auth: "public",
  rateLimit: "60 / min",
  summary: "Cities of a district by district UUID.",
  params: [{ name: "districtId", type: "uuid (path)", required: true, notes: "district UUID" }],
  response: `[ { "id": "…", "name": "Agra" } ]`,
  responseLabel: "Response 200",
};

const departments: EndpointSpec = {
  id: "get-departments",
  method: "GET",
  path: "/departments",
  auth: "public",
  rateLimit: "60 / min",
  summary: "All departments.",
  response: `[ { "slug": "rto", "name": "Road Transport Office", "category": "Transport" } ]`,
  responseLabel: "Response 200",
};

const postReport: EndpointSpec = {
  id: "post-reports",
  method: "POST",
  path: "/reports",
  auth: "public",
  rateLimit: "3 / hour",
  summary:
    "Submit an anonymous citizen report. On success the response contains a one-time submission_token — the reporter must keep it to check status later; only its sha256 digest is stored. At least one experience field must be present.",
  params: [
    { name: "service_id", type: "uuid", required: true, notes: "an existing service" },
    { name: "state_id", type: "uuid", required: true, notes: "an existing state" },
    { name: "district_id", type: "uuid", required: true, notes: "an existing district" },
    { name: "office_id", type: "uuid", required: false, notes: "nullable; internal reference, never exported" },
    { name: "period_start", type: "string", required: true, notes: "YYYY-MM-DD" },
    { name: "period_end", type: "string", required: true, notes: "YYYY-MM-DD; ≥ period_start" },
    { name: "official_fee_reported_inr", type: "number", required: false, notes: "0–10,000,000, multiple of 0.01" },
    { name: "additional_amount_reported_inr", type: "number", required: false, notes: "0–10,000,000, multiple of 0.01" },
    { name: "amount_paid_inr", type: "number", required: false, notes: "0–10,000,000, multiple of 0.01" },
    { name: "paid", type: "boolean", required: false, notes: "default false" },
    { name: "delay_days", type: "integer", required: false, notes: "0–3650" },
    { name: "visits", type: "integer", required: false, notes: "1–50" },
    { name: "description", type: "string", required: true, notes: "30–5000 chars" },
  ],
  request: `{
  "service_id": "…",
  "state_id": "…",
  "district_id": "…",
  "period_start": "2026-05-01",
  "period_end": "2026-05-31",
  "additional_amount_reported_inr": 1500,
  "amount_paid_inr": 2100,
  "paid": true,
  "delay_days": 45,
  "visits": 3,
  "description": "Applied for a new licence; was asked for an additional amount to avoid a further visit."
}`,
  requestLabel: "Request body",
  response: `{ "public_id": "R-a1b2c3d4", "status": "submitted", "submission_token": "<one-time>" }`,
  responseLabel: "Response 201",
  note:
    "public_id matches R-[a-z0-9]{8}. Unknown service_id / state_id / district_id returns 404; a description shorter than 30 characters, a negative fee, or period_end < period_start returns 400. The submitter's IP and any x-device-fingerprint header are hashed to sha256 — raw identifiers are never stored or returned.",
};

const reportStatus: EndpointSpec = {
  id: "get-report-status",
  method: "GET",
  path: "/reports/:publicId/status",
  auth: "public",
  summary: "Status lookup for a reporter, authenticated by the one-time token (the server compares the sha256 of the provided token with the stored digest).",
  params: [
    { name: "publicId", type: "string (path)", required: true, notes: "the report public id" },
    { name: "token", type: "string (query)", required: true, notes: "the one-time submission_token" },
  ],
  response: `{ "public_id": "R-a1b2c3d4", "status": "validated", "status_changed_at": "2026-08-20T00:00:00.000Z" }`,
  responseLabel: "Response 200",
  note: "A wrong token (or a token whose hash does not match) returns 404 — deliberately identical to an unknown report id.",
};

const publicReport: EndpointSpec = {
  id: "get-public-report",
  method: "GET",
  path: "/reports/:publicId",
  auth: "public",
  summary:
    "Public report view: service/state/district names, dates, amounts, visits, delay_days, the redacted description, evidence file metadata, and the report status. Contains no PII fields.",
  params: [{ name: "publicId", type: "string (path)", required: true, notes: "the report public id" }],
  response: `{
  "public_id": "R-a1b2c3d4",
  "status": "validated",
  "service": { "slug": "driving-licence", "name": "Driving Licence" },
  "state": "Uttar Pradesh",
  "district": "Varanasi",
  "period_start": "2026-05-01",
  "period_end": "2026-05-31",
  "official_fee_reported_inr": "600.00",
  "additional_amount_reported_inr": "1500.00",
  "amount_paid_inr": "2100.00",
  "paid": true,
  "delay_days": 45,
  "visits": 3,
  "description": "Had to pay extra to the agent. Contact [REDACTED] for details.",
  "evidence": [],
  "submitted_at": "2026-06-02T10:15:00.000Z",
  "status_changed_at": "2026-06-10T09:00:00.000Z"
}`,
  responseLabel: "Response 200",
};

const postEvidence: EndpointSpec = {
  id: "post-evidence",
  method: "POST",
  path: "/evidence",
  auth: "public",
  rateLimit: "10 / hour",
  summary:
    "Upload a supporting file for a report. Body is multipart/form-data; the file part must be a File ≤ 20 MB. The file is stored under a private key, its sha256 is recorded, and the evidence row is created in status pending_review with retention_until = now + 90 days.",
  params: [{ name: "file", type: "multipart/form-data", required: true, notes: "a File ≤ 20 MB" }],
  response: `{ "id": "<uuid>", "status": "pending_review", "retention_until": "2026-11-18T00:00:00.000Z" }`,
  responseLabel: "Response 201",
  note: "Oversized files (> 20 MB), missing file parts, or evidence for an unknown report return 400/404. Evidence is reviewed by moderators and auto-deleted after retention expires.",
};

const evidenceMeta: EndpointSpec = {
  id: "get-evidence",
  method: "GET",
  path: "/evidence/:id",
  auth: "public",
  summary: "Evidence metadata only — id, status, mime type, size, retention_until — never the file content and never for non-public statuses.",
  params: [{ name: "id", type: "uuid (path)", required: true, notes: "the evidence id" }],
  response: `{
  "id": "…",
  "status": "pending_review",
  "mime_type": "image/jpeg",
  "size_bytes": 154020,
  "retention_until": "2026-11-18T00:00:00.000Z"
}`,
  responseLabel: "Response 200",
};

const datasets: EndpointSpec = {
  id: "get-datasets",
  method: "GET",
  path: "/datasets",
  auth: "public",
  summary: "Dataset index.",
  response: `{
  "datasets": [
    { "name": "reports", "format": "csv", "url": "/datasets/reports.csv" },
    { "name": "reports", "format": "json", "url": "/datasets/reports.json" }
  ],
  "generated_at": "2026-08-20T00:00:00.000Z",
  "license": "CC BY 4.0 (data) / MIT (code) — see docs/methodology.md",
  "notice": "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing."
}`,
  responseLabel: "Response 200",
};

const datasetCsv: EndpointSpec = {
  id: "get-dataset-csv",
  method: "GET",
  path: "/datasets/reports.csv",
  auth: "public",
  summary: "The full public dataset as RFC 4180 CSV. Content type text/csv, served with Cache-Control: no-store. Column order and semantics match the data dictionary exactly.",
  response: `public_id,service_slug,service_name,department,state_code,...
R-a1b2c3d4,driving-licence,Driving Licence,Transport,UP,...`,
  responseLabel: "Response (text/csv)",
};

const datasetJson: EndpointSpec = {
  id: "get-dataset-json",
  method: "GET",
  path: "/datasets/reports.json",
  auth: "public",
  summary: "The same dataset as a JSON array of objects. Money values are decimal strings. Content type application/json, Cache-Control: no-store.",
  response: `[
  {
    "public_id": "R-a1b2c3d4",
    "service_slug": "driving-licence",
    "state_code": "UP",
    "additional_amount_reported_inr": "1500.00",
    "delay_days": 45,
    "visits": 3,
    "status": "validated",
    "created_at": "2026-06-02T10:15:00.000Z"
  }
]`,
  responseLabel: "Response 200",
  note: "Both exports contain only published reports and never ip_hash, device hashes, token hashes, or office identifiers.",
};

const doc: EndpointSpec = {
  id: "get-doc",
  method: "GET",
  path: "/doc",
  auth: "public",
  summary: "JSON index of machine-readable documentation.",
  response: `{ "openapi": "/doc/openapi.json", "datasets": "/datasets", "data_dictionary": "docs/data-dictionary.md" }`,
  responseLabel: "Response 200",
};

const openapi: EndpointSpec = {
  id: "get-openapi",
  method: "GET",
  path: "/doc/openapi.json",
  auth: "public",
  summary: "The OpenAPI 3.0 specification for the endpoints above. This is the authoritative wire-format reference — when this page and the spec disagree, the spec wins.",
  response: `{ "openapi": "3.0.0", "info": { "title": "Rishwat.fyi API", "version": "…" }, "paths": { … } }`,
  responseLabel: "Response 200",
};

export const PUBLIC_GROUPS: EndpointGroup[] = [
  { id: "ep-health", title: "Health", endpoints: [health] },
  { id: "ep-services", title: "Search and services", endpoints: [search, services, serviceDetail] },
  { id: "ep-locations", title: "Locations", endpoints: [states, districts, cities, departments] },
  {
    id: "ep-reports",
    title: "Reports and evidence",
    endpoints: [postReport, reportStatus, publicReport, postEvidence, evidenceMeta],
  },
  {
    id: "ep-datasets",
    title: "Datasets and documentation",
    endpoints: [datasets, datasetCsv, datasetJson, doc, openapi],
  },
];
