import type { EndpointSpec } from "@/components/doc";

/**
 * Admin/moderation endpoint specifications. Transcribed from docs/api.md. All
 * except the login endpoint require a Bearer JWT. Example values match the
 * documented response shapes; no fields are invented. Where docs/api.md does
 * not spell out a request body's field names, the shape is described in prose
 * rather than fabricated.
 */

const login: EndpointSpec = {
  id: "post-login",
  method: "POST",
  path: "/admin/auth/login",
  auth: "public",
  rateLimit: "per-IP (auth)",
  summary:
    "Exchange credentials for a JWT. Tokens are HS256, valid 12 h, carrying sub (user id) and role. Wrong password and unknown email both return the same 401 — there is no user enumeration.",
  params: [
    { name: "email", type: "string", required: true, notes: "valid email, ≤ 254 chars" },
    { name: "password", type: "string", required: true, notes: "8–200 chars" },
  ],
  request: `{ "email": "moderator@rishwat.fyi", "password": "password" }`,
  requestLabel: "Request body",
  response: `{
  "token": "<jwt>",
  "user": { "id": "<uuid>", "email": "moderator@rishwat.fyi", "name": "…", "role": "moderator" }
}`,
  responseLabel: "Response 200",
};

const queue: EndpointSpec = {
  id: "get-queue",
  method: "GET",
  path: "/admin/queue",
  auth: "moderator",
  summary:
    "The moderation queue: reports, oldest first, joined with service and district names and evidence counts.",
  params: [
    { name: "status", type: "string", notes: "filter by report status" },
    { name: "page", type: "int ≥ 1", notes: "default 1" },
    { name: "per_page", type: "int 1–100", notes: "default 20" },
  ],
  response: `{
  "total": 1,
  "items": [
    {
      "public_id": "R-a1b2c3d4",
      "status": "submitted",
      "service_name": "Driving Licence",
      "district_name": "Varanasi",
      "state_name": "Uttar Pradesh",
      "submitted_at": "2026-06-02T10:15:00.000Z",
      "evidence_count": 1,
      "description": "…",
      "additional_amount_reported_inr": "1500.00",
      "delay_days": 45,
      "visits": 3,
      "duplicate_group_id": null
    }
  ]
}`,
  responseLabel: "Response 200",
};

const decide: EndpointSpec = {
  id: "post-decide",
  method: "POST",
  path: "/admin/reports/decide",
  auth: "moderator",
  summary:
    "Apply a decision to a report. Every decision records a moderation_actions row and a verification_events row. Illegal transitions return 400.",
  params: [
    { name: "public_id", type: "string", required: true, notes: "the report public id" },
    {
      name: "action",
      type: "enum",
      required: true,
      notes: "mark_validated | reject | acknowledge_officially | withdraw",
    },
    { name: "reason", type: "string", required: false, notes: "≤ 1000 chars; required for reject" },
    {
      name: "source_url",
      type: "string",
      required: false,
      notes: "required for acknowledge_officially (a government/official source); 400 without it",
    },
  ],
  request: `{
  "public_id": "R-a1b2c3d4",
  "action": "mark_validated",
  "reason": "Passes basic quality checks.",
  "source_url": "https://example.gov.in/acknowledgement"
}`,
  requestLabel: "Request body",
  response: `{ "public_id": "R-a1b2c3d4", "status": "validated", "status_changed_at": "2026-08-20T00:00:00.000Z" }`,
  responseLabel: "Response 200",
  note: "The action → status mapping and the escalation path are described in the moderation workflow.",
};

const evidenceReview: EndpointSpec = {
  id: "post-evidence-review",
  method: "POST",
  path: "/admin/evidence/review",
  auth: "moderator",
  summary:
    "Review an evidence file (evidenceReviewSchema): mark it accepted or rejected. Accepting evidence for a report that is already validated promotes the report to evidence_backed (recorded with method evidence_review).",
  response: `{ "id": "<uuid>", "status": "accepted", "retention_until": "2026-11-18T00:00:00.000Z" }`,
  responseLabel: "Response 200",
  note: "Body (evidenceReviewSchema) carries the evidence id and the decision — accepted or rejected.",
};

const statsOverview: EndpointSpec = {
  id: "get-stats-overview",
  method: "GET",
  path: "/admin/stats/overview",
  auth: "admin",
  summary: "Real SQL aggregates over the database.",
  response: `{
  "total_reports": 0,
  "published_reports": 0,
  "pending_review": 0,
  "rejected": 0,
  "corroboration_rate": 0,
  "reports_last_7_days": 0,
  "states_covered": 0,
  "services_covered": 0
}`,
  responseLabel: "Response 200 (shape)",
  note: "Values shown are the response shape, not live figures.",
};

const statsDuplicates: EndpointSpec = {
  id: "get-stats-duplicates",
  method: "GET",
  path: "/admin/stats/duplicates",
  auth: "admin",
  summary: "Duplicate groups (duplicate_group_id with count ≥ 2).",
  response: `[
  {
    "group_id": "…",
    "report_count": 2,
    "service_slug": "driving-licence",
    "district_name": "Varanasi",
    "oldest": "2026-06-01T00:00:00.000Z",
    "newest": "2026-06-02T00:00:00.000Z"
  }
]`,
  responseLabel: "Response 200",
};

const statsClusters: EndpointSpec = {
  id: "get-stats-clusters",
  method: "GET",
  path: "/admin/stats/clusters",
  auth: "admin",
  summary:
    "Coordinated-submission clusters for IP-hash + service groups with count ≥ 5 in the detection window (see the methodology's anti-abuse signals).",
  response: `[
  {
    "ip_hash_prefix": "…",
    "service_slug": "driving-licence",
    "report_count": 5,
    "time_range": { "from": "2026-06-02T10:00:00.000Z", "to": "2026-06-02T10:45:00.000Z" }
  }
]`,
  responseLabel: "Response 200",
};

export const ADMIN_ENDPOINTS: EndpointSpec[] = [
  login,
  queue,
  decide,
  evidenceReview,
  statsOverview,
  statsDuplicates,
  statsClusters,
];
