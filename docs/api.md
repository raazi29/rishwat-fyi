# API Reference

The Rishwat.fyi API is the public contract of the platform. It serves the public data layer (search, services, locations, reports, evidence metadata, datasets, documentation) and a separate, authenticated area for moderators and admins.

The **machine-readable** version of this reference is the OpenAPI 3.0 specification served by the API itself at:

> `GET /doc/openapi.json`

This document is the human-readable companion. When the two disagree, the OpenAPI spec is authoritative for wire format; the data dictionary (`docs/data-dictionary.md`) is authoritative for dataset semantics.

**Base URL:** the value of the `PUBLIC_BASE_URL` environment variable (default `http://localhost:8787`). All paths below are relative to that base.

## Conventions

- **Content type:** JSON (`application/json`) except `GET /datasets/reports.csv` (`text/csv`) and evidence uploads (`multipart/form-data`).
- **Errors:** every non-2xx response has the shape `{ "error": { "code": "<machine-readable-code>", "message": "<human-readable-message>" } }`. Codes include `not_found`, `unauthorized`, `forbidden`, `bad_request`, `conflict`, `rate_limited`, `internal_error`.
- **Money:** monetary values are decimal strings (e.g. `"1500.00"`) matching `numeric(12,2)` precision, never floats.
- **Pagination:** list endpoints accept `page` (≥ 1, default 1) and `per_page` (1–100, default 20) and return `{ total, items }`.
- **Rate limiting:** see the table below. Limiters key on the client IP resolved from the socket plus the configured number of trusted `x-forwarded-for` hops. Exceeded limits return `429` with `rate_limited`.

### Rate limits

| Limiter | Limit | Applied to |
| --- | --- | --- |
| `standardRateLimit` | 60 requests / minute per IP | Public read endpoints (`/search`, `/services`, `/locations/*`) |
| `strictRateLimit` | 3 requests / hour per IP | `POST /reports` |
| `evidenceRateLimit` | 10 requests / hour per IP | `POST /evidence` |
| `authRateLimit` | 10 requests / 15 minutes per IP | `POST /admin/auth/login` |

Login uses its own limiter so a few password mistakes do not consume a citizen's report-submission allowance.

The client IP a limiter keys on is derived according to `TRUSTED_PROXY_HOPS`. When it is `0` (the default) forwarding headers are ignored entirely and only the socket peer counts; behind a proxy or CDN it must be set to the number of hops you control, or clients can forge the value and evade the limits.

Authed admin/moderation endpoints are bounded by their short-lived JWTs (12 h) rather than a documented public rate limit.

### Authentication

Admin routes require a JWT issued by `POST /admin/auth/login`, sent as `Authorization: Bearer <token>`.

- `moderator` — can work the moderation queue (view queue, decide reports, review evidence).
- `admin` — everything a moderator can do, plus the stats endpoints.

A missing/invalid token returns `401 unauthorized`; a valid token with insufficient role returns `403 forbidden`. There is no user enumeration on login: unknown email and wrong password both return the same `401`.

## Endpoint reference

| Method | Path | Auth | Rate limit | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | public | — | — | `200 { status, database, storage, time }`, or `503` when the database is down |
| GET | `/search` | public | standard | query: `q`, `department`, `state`, `district`, `page`, `per_page` | `{ total, items }` |
| GET | `/services` | public | standard | query: `q`, `department`, `state`, `district`, `page`, `per_page` | `{ total, items }` |
| GET | `/services/:slug` | public | standard | path: `slug` | `{ id, slug, name, description, department, official, sources, citizen, notice }` |
| GET | `/locations/states` | public | standard | — | `{ items: [{ id, code, name }] }` |
| GET | `/locations/states/:code/districts` | public | standard | path: `code` | `{ state, items: [{ id, code, name }] }` |
| GET | `/locations/districts/:districtId/cities` | public | standard | path: `districtId` | `{ items: [{ id, name }] }` |
| GET | `/locations/districts/:districtId/offices` | public | standard | path: `districtId`; query: `service` | `{ items }` |
| GET | `/locations/offices/:id` | public | standard | path: `id` | office detail object |
| GET | `/locations/departments` | public | standard | — | `{ items: [{ id, slug, name, category }] }` |
| POST | `/reports` | public | strict (3/h) | body: report submission | `201 { public_id, token, status }` |
| GET | `/reports/:publicId/status` | public | — | query: `token` | `{ public_id, status, status_changed_at }` or `404` |
| GET | `/reports/:publicId` | public | — | path: `publicId` | public report view |
| POST | `/evidence` | public | evidence (10/h) | multipart file (≤ 20 MB) | `201 { id, mime_type, size_bytes, sha256, status, retention_until }` |
| GET | `/evidence/:id` | public | — | path: `id` | accepted evidence metadata (no content); `404` for pending/rejected |
| GET | `/datasets` | public | — | — | `{ datasets, generated_at, license }` |
| GET | `/datasets/reports.csv` | public | — | — | CSV (`text/csv`, `Cache-Control: public, max-age=300`) |
| GET | `/datasets/reports.json` | public | — | — | `{ total, rows }` (`application/json`, `Cache-Control: public, max-age=300`) |
| GET | `/doc` | public | — | — | HTML API documentation landing page |
| GET | `/doc/openapi.json` | public | — | — | OpenAPI 3.0 specification |
| POST | `/admin/auth/login` | public | auth | body: `{ email, password }` | `{ token, user }` |
| GET | `/admin/queue` | moderator | — | query: `status`, `page`, `per_page` | paginated queue |
| POST | `/admin/reports/decide` | moderator | — | body: moderation decision | updated report |
| POST | `/admin/evidence/review` | moderator | — | body: evidence review | updated evidence |
| GET | `/admin/stats/overview` | admin | — | — | aggregate counts |
| GET | `/admin/stats/duplicates` | admin | — | — | duplicate groups |
| GET | `/admin/stats/clusters` | admin | — | — | coordinated clusters |
| POST | `/admin/jobs/corroborate` | admin | — | — | promotion summary |
| POST | `/admin/jobs/recompute-aggregates` | admin | — | — | materialization summary |
| POST | `/admin/jobs/purge-evidence` | admin | — | — | retention purge summary |

---

## Public endpoints

### `GET /health`

Liveness + dependency probe. Runs `SELECT 1` against Postgres and performs a cheap check of the configured evidence-storage backend.

Response `200` (healthy):

```json
{
  "status": "ok",
  "database": "up",
  "storage": { "driver": "local", "status": "up" },
  "time": "2026-08-20T00:00:00.000Z"
}
```

**Status-code contract.** The endpoint returns **`200`** with `status: "ok"` when healthy, and **`503`** with `status: "degraded"` when a *hard* dependency is down. Postgres is the only hard dependency: without it the API can serve neither reads, writes, nor the public dataset, so a load balancer or uptime monitor watching the status code must take the instance out of rotation.

Response `503` (database unreachable):

```json
{
  "status": "degraded",
  "database": "down",
  "storage": { "driver": "local", "status": "up" },
  "time": "2026-08-20T00:00:00.000Z"
}
```

**Fields.**

- `status` — `"ok"` when healthy (HTTP 200); `"degraded"` when a hard dependency is down (HTTP 503).
- `database` — `"up"` or `"down"` from a `SELECT 1` round-trip. `"down"` is what drives the `503`.
- `storage` — evidence-storage backend health, `{ "driver": "local" | "supabase", "status": "up" | "down" | "configured" }`:
  - `local`: `status` reflects whether the configured directory exists and is writable, from a single `fs.access` check — no file is written per poll.
  - `supabase`: `status` is the static value `"configured"`. The health endpoint deliberately does **not** make a network round-trip to object storage on every poll, since that would make `/health` itself an outage and cost risk.
- `time` — ISO 8601 timestamp of the probe.

**Storage is advisory.** A storage failure does **not** produce a `503` and does **not** change `status`. The API can still serve every read endpoint and the entire public dataset with a dead storage backend — only evidence *upload* breaks. Storage health is surfaced separately so operators can see it, but only a database failure degrades overall health.

### `GET /search`

Full-text search across services. `q` is matched against the service search vector, name (`ILIKE`), and trigram similarity (`%` operator via `pg_trgm`). Supports the same filters as `GET /services`.

Query parameters:

| Param | Type | Notes |
| --- | --- | --- |
| `q` | string | ≤ 200 chars; search term |
| `department` | string | department slug filter |
| `state` | string | state name filter |
| `district` | string | district name filter |
| `page` | int ≥ 1 | default 1 |
| `per_page` | int 1–100 | default 20 |

Response `200`:

```json
{
  "total": 1,
  "items": [
    {
      "id": "6a1f0c2e-… (service UUID — use as service_id when submitting a report)",
      "slug": "driving-licence",
      "name": "Driving Licence",
      "department": "Transport",
      "description": "…",
      "report_count": 284
    }
  ]
}
```

Invalid `per_page` (e.g. `1000`) returns `400`.

### `GET /services`

List services with the same query schema as `/search` (returns `{ total, items }` of `id`, `slug`, `name`, `department`, `description`, `report_count`). The `id` is the service UUID and is what a client passes as `service_id` when submitting a report; `slug` is also accepted (as `service_slug`). With no filters it returns all seeded services (12 at launch).

### `GET /services/:slug`

Service detail. Returns the official block, its government sources, the citizen-experience aggregates, and the standard notice.

```json
{
  "id": "6a1f0c2e-… (service UUID — pass as service_id when submitting a report)",
  "slug": "driving-licence",
  "name": "Driving Licence",
  "description": "…",
  "department": { "slug": "transport", "name": "Transport" },
  "official": {
    "fee_inr": "1000.00",
    "timeline_days": 7,
    "visits": 1,
    "documents": [ { "name": "…", "required": true } ],
    "process_steps": [ { "order": 1, "title": "…", "description": "…" } ]
  },
  "sources": {
    "fee": { "url": "…", "title": "…", "department": "…", "publication_date": "…", "last_verified_at": "…", "retrieved_at": "…" },
    "timeline": { "url": "…", "title": "…", "department": "…", "publication_date": "…", "last_verified_at": "…", "retrieved_at": "…" }
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
}
```

The top-level `id` is the service UUID; `slug` is the human-readable identifier. Either can be used to submit a report (`service_id` / `service_slug`).

The `citizen` block is computed over reports with status `validated | corroborated | evidence_backed | officially_acknowledged` for that service (optionally filtered to a district). It is only `published: true` when the report set has **≥ 3 reports from ≥ 2 distinct IP-hash buckets** for the same (service, district) cell; otherwise all statistics are `null` and `published` is `false`, while `report_count` still shows the actual count. See [`docs/methodology.md`](methodology.md) for the aggregate definitions. Unknown slug returns `404`.

### `GET /locations/states`

All states, alphabetical. Wrapped in an `items` envelope.

```json
{ "items": [ { "id": "…", "code": "UP", "name": "Uttar Pradesh" } ] }
```

### `GET /locations/states/:code/districts`

Districts of the state identified by its ISO 3166-2:IN code (e.g. `UP`, case-insensitive). Returns the resolved `state` alongside its `items`. Unknown code returns `404`.

```json
{
  "state": { "id": "…", "code": "UP", "name": "Uttar Pradesh" },
  "items": [ { "id": "…", "code": "UP01", "name": "Agra" } ]
}
```

### `GET /locations/districts/:districtId/cities`

Cities of a district by district UUID. Wrapped in an `items` envelope.

```json
{ "items": [ { "id": "…", "name": "Agra" } ] }
```

### `GET /locations/districts/:districtId/offices`

Government offices located in a district, identified by district UUID, ordered by name. Optionally narrowed to a single service with `?service=<slug>` (e.g. `?service=driving-licence`).

An **unknown district UUID returns `404`**; a district that exists but has no offices (or no offices for the filtered service) returns `200` with an empty `items` array. `location` is `{ lat, lon }` in WGS 84 (SRID 4326), or `null` when the office has no recorded coordinate.

```json
{
  "items": [
    {
      "id": "…",
      "name": "Regional Transport Office, Varanasi",
      "address": null,
      "service": { "slug": "driving-licence", "name": "Driving Licence" },
      "location": null
    }
  ]
}
```

### `GET /locations/offices/:id`

A single office by UUID, joined to its service, state and district names. Returns the office object directly (no `items` envelope). Unknown id returns `404`. `district` is `null` for the rare office not tied to a district; `location` is `{ lat, lon }` or `null`.

```json
{
  "id": "…",
  "name": "Regional Passport Office, Mumbai",
  "address": null,
  "service": { "slug": "passport", "name": "Passport (Fresh / Reissue)" },
  "state": { "code": "MH", "name": "Maharashtra" },
  "district": { "code": "mumbai-city", "name": "Mumbai City" },
  "location": null
}
```

### `GET /locations/departments`

All departments, alphabetical. Wrapped in an `items` envelope.

```json
{ "items": [ { "id": "…", "slug": "rto", "name": "Road Transport Office", "category": "transport" } ] }
```

### `POST /reports`

Submit an anonymous citizen report. Public, but rate-limited to **3 requests/hour per IP**. On success the response contains a one-time `token` — the reporter must keep it to check status later; only its `sha256` digest is stored (server-side the digest column is `submission_token_hash`).

Request body — validated by `reportSubmissionSchema` (see the machine-readable schema at `data/schemas/report.schema.json` and the column semantics in [`docs/data-dictionary.md`](data-dictionary.md)):

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `service_id` | uuid | conditional | an existing service; provide **exactly one** of `service_id` or `service_slug` |
| `service_slug` | slug | conditional | an existing service slug (as returned by `/services`, `/search`, `/services/:slug`); provide **exactly one** of `service_id` or `service_slug` |
| `state_id` | uuid | yes | an existing state |
| `district_id` | uuid | yes | an existing district |
| `office_id` | uuid | no | optional; if present must be a valid UUID (an explicit `null` is rejected); internal reference, never exported |
| `period_start` | string | yes | `YYYY-MM-DD` |
| `period_end` | string | yes | `YYYY-MM-DD`; ≥ `period_start` |
| `official_fee_reported_inr` | number | no | 0–10,000,000, multiple of 0.01 |
| `additional_amount_reported_inr` | number | no | 0–10,000,000, multiple of 0.01 |
| `amount_paid_inr` | number | no | 0–10,000,000, multiple of 0.01 |
| `paid` | boolean | no | default `false` |
| `delay_days` | integer | no | 0–3650 |
| `visits` | integer | no | 1–50 |
| `description` | string | yes | 30–5000 chars |

At least one experience field must be present (the description and/or one or more of the structured fields above) — enforced by the validation layer.

Response `201`:

```json
{ "public_id": "R-a1b2c3d4", "token": "<one-time>", "status": "submitted" }
```

`public_id` matches `R-[a-z0-9]{8}`. An unknown or unresolvable `service_id`/`service_slug`/`state_id`/`district_id` (or a `district_id` that does not belong to `state_id`) returns `400`, as do a description shorter than 30 characters, a negative fee, `period_end < period_start`, or supplying neither or both of `service_id` and `service_slug`. The report enters status `submitted` and is screened by the anti-abuse system and the moderation queue (see [`docs/moderation.md`](moderation.md)). The API hashes the submitter's IP and any `x-device-fingerprint` header to `sha256` digests — raw identifiers are never stored or returned (see [`docs/privacy.md`](privacy.md)).

### `GET /reports/:publicId/status`

Status lookup for a reporter, authenticated by the one-time token.

Query: `token=<token>` (the one-time token returned by `POST /reports`). The server compares the `sha256` of the provided token with the stored digest.

```json
{ "public_id": "R-a1b2c3d4", "status": "validated", "status_changed_at": "2026-08-20T00:00:00.000Z" }
```

Wrong token (or a token whose hash does not match) returns `404` — deliberately identical to an unknown report id.

### `GET /reports/:publicId`

Public report view: service/state/district names, dates, amounts, `visits`, `delay_days`, the **redacted** description, accepted evidence metadata, and the report status. Contains no PII fields (no IP hash, device hash, token, or office). Rejected and withdrawn reports return `404` publicly; their submitters can still retrieve terminal status through the token-protected status endpoint.

### `POST /evidence`

Upload a supporting file for a report. Rate-limited to **10 requests/hour per IP**. Body is `multipart/form-data`; the file part must be a `File` ≤ 20 MB.

Only the submitter may attach evidence, because accepted evidence promotes its report to `evidence_backed`. Identify the report with either `public_id` (`R-xxxxxxxx`, what the reporter is given) or `report_id` (the internal uuid, for server-side callers), and include the one-time `token` from `POST /reports` in the same form. A wrong token and an unknown report both return `404` so the endpoint cannot be used to probe whether a report exists.

| Field | Required | Notes |
| --- | --- | --- |
| `file` | yes | `image/jpeg`, `image/png`, `image/webp`, `image/heic` or `application/pdf`, ≤ 20 MB |
| `token` | yes | The one-time token from `POST /reports` |
| `public_id` | one of | The reporter-facing id, `R-xxxxxxxx` |
| `report_id` | one of | The internal report uuid |
 The file is stored through the configured storage adapter (`local` or `supabase`) under a private key, its `sha256` is computed and recorded, and the evidence row is created in status `pending_review` with:

> `retention_until = now + 90 days`

Response `201`:

```json
{
  "id": "<uuid>",
  "mime_type": "image/png",
  "size_bytes": 20480,
  "sha256": "<hex>",
  "status": "pending_review",
  "retention_until": "2026-11-18T00:00:00.000Z"
}
```

`retention_until` is `now + 90 days` and is what the retention purge acts on. Oversized files (> 20 MB), missing file parts, or evidence for an unknown report return `400`/`404`. Evidence is reviewed by moderators (`POST /admin/evidence/review`) and permanently deleted once `retention_until` passes by the retention purge (`POST /admin/jobs/purge-evidence` / `npm run purge-evidence`; see [`docs/privacy.md`](privacy.md)).

### `GET /evidence/:id`

Evidence **metadata only** — id, status, mime type, size, SHA-256 and upload time — never the file content, internal report UUID, or storage key. Only `accepted` evidence is public; pending-review and rejected evidence return `404`. Used by the public report view to list reviewed attachments.

### `GET /datasets`

Dataset index.

```json
{
  "datasets": [
    {
      "name": "reports",
      "description": "Publishable citizen reports, PII-redacted.",
      "formats": {
        "csv": "http://localhost:8787/datasets/reports.csv",
        "json": "http://localhost:8787/datasets/reports.json"
      }
    }
  ],
  "license": "Data: CC BY 4.0 (see LICENSE-DATA). Code: MIT (see LICENSE).",
  "generated_at": "2026-08-20T00:00:00.000Z"
}
```

Served with `Cache-Control: public, max-age=300`.

### `GET /datasets/reports.csv`

The full public dataset as RFC 4180 CSV (fields containing a comma, quote, CR or LF are wrapped in double quotes with embedded quotes doubled; records are separated by CRLF and the body ends with a trailing CRLF). Content type `text/csv; charset=utf-8`, served with `Cache-Control: public, max-age=300` and a `Content-Disposition` attachment filename. Column order and semantics match the data dictionary exactly.

### `GET /datasets/reports.json`

The same dataset as `{ "total": <n>, "rows": [ … ] }`, where `rows` is an array of objects (one per report) and `total` is `rows.length`. Object keys are the snake_case column names in the data dictionary; money values are decimal strings. Content type `application/json`, `Cache-Control: public, max-age=300`.

Both exports contain **only published reports** (statuses `validated`, `corroborated`, `evidence_backed`, `officially_acknowledged`) and **never** `ip_hash`, device hashes, token hashes, or office identifiers. See [`docs/data-dictionary.md`](data-dictionary.md) and [`docs/mirroring.md`](mirroring.md).

### `GET /doc`

HTML landing page linking to the machine-readable OpenAPI document and public data resources. The authoritative JSON specification is `GET /doc/openapi.json`.

### `GET /doc/openapi.json`

The OpenAPI 3.0 specification for the endpoints above (methods, paths, parameters, schemas, response codes). This is the authoritative wire-format reference.

---

## Admin endpoints

All admin endpoints except `/admin/auth/login` require a Bearer JWT (`Authorization: Bearer <token>`).

### `POST /admin/auth/login`

Body:

```json
{ "email": "moderator@rishwat.fyi", "password": "password" }
```

- `email` — valid email, ≤ 254 chars.
- `password` — 8–200 chars.

Response `200`:

```json
{
  "token": "<jwt>",
  "user": { "id": "<uuid>", "email": "moderator@rishwat.fyi", "name": "…", "role": "moderator" }
}
```

Wrong password and unknown email both return the same `401`. Tokens are HS256 JWTs (`JWT_SECRET`), valid 12 h, carrying `sub` (user id) and `role`.

### `GET /admin/queue`

The moderation queue: reports, oldest first, joined with service and district names and evidence counts. Query: `status` (filter by report status), `page`, `per_page`. Requires `moderator` or `admin`.

### `POST /admin/reports/decide`

Apply a decision to a report. Body (`moderationDecisionSchema`):

```json
{
  "public_id": "R-a1b2c3d4",
  "action": "mark_validated",
  "reason": "Passes basic quality checks.",
  "source_url": "https://example.gov.in/acknowledgement"
}
```

| `action` | Target status | Notes |
| --- | --- | --- |
| `mark_validated` | `validated` | Basic spam/quality checks passed |
| `reject` | `rejected` | Terminal; reason required |
| `acknowledge_officially` | `officially_acknowledged` | `source_url` required (a government authority/official source acknowledging the issue); returns `400` without it |
| `withdraw` | `withdrawn` | Terminal; at the reporter's request or by process |

`reason` ≤ 1000 chars. Every decision records a `moderation_actions` row (moderator, action, reason, timestamp) and a `verification_events` row. Illegal transitions (e.g. rejecting an already-rejected report) return `400`. See [`docs/moderation.md`](moderation.md).

### `POST /admin/evidence/review`

Review an evidence file (`evidenceReviewSchema`): mark it `accepted` or `rejected`. Accepting evidence for a report that is already `validated` promotes the report to `evidence_backed` (recorded with method `evidence_review`).

### `GET /admin/stats/overview` *(admin only)*

Real SQL aggregates over the database: `total_reports`, `published_reports`, `pending_review`, `rejected`, `corroboration_rate`, `reports_last_7_days`, `states_covered`, `services_covered`.

### `GET /admin/stats/duplicates` *(admin only)*

Duplicate groups (`duplicate_group_id` with count ≥ 2): `group_id`, `report_count`, `service_slug`, `district_name`, `oldest`, `newest`.

### `GET /admin/stats/clusters` *(admin only)*

Coordinated-submission clusters detected by the anti-abuse system: `{ ip_hash_prefix, service_slug, report_count, time_range }` for IP-hash + service groups with count ≥ 5 in the detection window. See [`docs/methodology.md`](methodology.md) for the anti-abuse signals.

### Maintenance jobs *(admin only)*

Operational jobs under `/admin/jobs/*` are admin-only and each has a matching CLI script (in `apps/api/src/scripts/`) that a production cron invokes on a schedule. Each returns a small JSON summary with the job name and a `ran_at` ISO timestamp.

#### `POST /admin/jobs/corroborate`

Runs the auto-corroboration pass: any `(service, district)` cell with ≥ 3 live reports from ≥ 2 distinct IP buckets promotes its pending (`submitted`/`validated`) reports to `corroborated`.

```json
{ "job": "corroborate", "promoted_count": 2, "promoted": [ { "public_id": "R-…", "from_status": "submitted", "to_status": "corroborated" } ], "ran_at": "2026-08-20T00:00:00.000Z" }
```

#### `POST /admin/jobs/recompute-aggregates`

Materializes the public statistics into `aggregate_metrics` (one row per `service`/`district`/`metric_type` cell), using the same computations and publishing threshold as the live service aggregates. CLI: `npm run recompute`.

```json
{ "job": "recompute-aggregates", "cells": 12, "rows": 48, "ran_at": "2026-08-20T00:00:00.000Z" }
```

#### `POST /admin/jobs/purge-evidence`

Enforces the evidence retention policy (see [`docs/privacy.md`](privacy.md)): permanently deletes every evidence file whose `retention_until` has passed, from **both** the storage backend and the metadata table. The storage object is removed first and the metadata row only once that succeeds, so a file is never orphaned. Resilient — one object that fails to delete does not abort the run. CLI: `npm run purge-evidence` (what a production cron runs, e.g. daily).

```json
{ "job": "purge-evidence", "examined": 7, "deleted": 6, "failed": 1, "failed_keys": ["<report-uuid>/<sha256>"], "ran_at": "2026-08-20T00:00:00.000Z" }
```

`failed_keys` lists storage keys that could not be removed (internal ids, admin-only) so an operator can investigate; those rows are retained and retried on the next run.

---

## Versioning and stability

The public routes (`/search`, `/services`, `/locations`, `/reports`, `/evidence`, `/datasets`, `/doc`) are the stable contract. The data dictionary and the OpenAPI spec must be updated in the same change as any alteration to them — see [`docs/data-dictionary.md`](data-dictionary.md) §7.