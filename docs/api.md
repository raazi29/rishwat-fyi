# API Reference

The Rishwat.fyi API is the public contract of the platform. It serves the public data layer (search, services, locations, reports, evidence metadata, datasets, documentation) and a separate, authenticated area for moderators and admins.

The **machine-readable** version of this reference is the OpenAPI 3.0 specification served by the API itself at:

> `GET /doc/openapi.json`

This document is the human-readable companion. When the two disagree, the OpenAPI spec is authoritative for wire format; the data dictionary (`docs/data-dictionary.md`) is authoritative for dataset semantics.

**Base URL:** the value of the `PUBLIC_BASE_URL` environment variable (default `http://localhost:8787`). All paths below are relative to that base.

## Conventions

- **Content type:** JSON (`application/json`) except `GET /datasets/reports.csv` (`text/csv`) and evidence uploads (`multipart/form-data`).
- **Errors:** every non-2xx response has the shape `{ "error": { "code": "<machine-readable-code>", "message": "<human-readable-message>" } }`. Codes include `not_found`, `unauthorized`, `forbidden`, `bad_request`, `conflict`, `too_many_requests`, `internal_error`.
- **Money:** monetary values are decimal strings (e.g. `"1500.00"`) matching `numeric(12,2)` precision, never floats.
- **Pagination:** list endpoints accept `page` (≥ 1, default 1) and `per_page` (1–100, default 20) and return `{ total, items }`.
- **Rate limiting:** see the table below. Limiters key on the client IP (`x-forwarded-for` → `cf-connecting-ip` → `"unknown"`). Exceeded limits return `429` with `too_many_requests`.

### Rate limits

| Limiter | Limit | Applied to |
| --- | --- | --- |
| `standardLimiter` | 60 requests / minute per IP | Public read endpoints (`/search`, `/services`, `/locations`, `/states`, `/departments`) |
| `strictLimiter` | 3 requests / hour per IP | `POST /reports` |
| `evidenceLimiter` | 10 requests / hour per IP | `POST /evidence` |
| `authLimiter` | Dedicated per-IP limiter on the login endpoint | `POST /admin/auth/login` |

Authed admin/moderation endpoints are bounded by their short-lived JWTs (12 h) rather than a documented public rate limit.

### Authentication

Admin routes require a JWT issued by `POST /admin/auth/login`, sent as `Authorization: Bearer <token>`.

- `moderator` — can work the moderation queue (view queue, decide reports, review evidence).
- `admin` — everything a moderator can do, plus the stats endpoints.

A missing/invalid token returns `401 unauthorized`; a valid token with insufficient role returns `403 forbidden`. There is no user enumeration on login: unknown email and wrong password both return the same `401`.

## Endpoint reference

| Method | Path | Auth | Rate limit | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | public | — | — | `{ status, database, time }` or `503` |
| GET | `/search` | public | standard | query: `q`, `department`, `state`, `district`, `page`, `per_page` | `{ total, items }` |
| GET | `/services` | public | standard | query: `q`, `department`, `state`, `district`, `page`, `per_page` | `{ total, items }` |
| GET | `/services/:slug` | public | standard | path: `slug` | `{ service, sources, citizen, notice }` |
| GET | `/states` | public | standard | — | `[{ id, code, name }]` |
| GET | `/states/:code/districts` | public | standard | path: `code` | `[{ id, code, name }]` |
| GET | `/districts/:districtId/cities` | public | standard | path: `districtId` | `[{ id, name }]` |
| GET | `/departments` | public | standard | — | `[{ slug, name, category }]` |
| POST | `/reports` | public | strict (3/h) | body: report submission | `201 { public_id, status, submission_token }` |
| GET | `/reports/:publicId/status` | public | — | query: `token` | `{ public_id, status, status_changed_at }` or `404` |
| GET | `/reports/:publicId` | public | — | path: `publicId` | public report view |
| POST | `/evidence` | public | evidence (10/h) | multipart file (≤ 20 MB) | `201 { id, status, retention_until }` |
| GET | `/evidence/:id` | public | — | path: `id` | evidence metadata (no content) |
| GET | `/datasets` | public | — | — | `{ datasets, generated_at, license, notice }` |
| GET | `/datasets/reports.csv` | public | — | — | CSV (`text/csv`, no-store) |
| GET | `/datasets/reports.json` | public | — | — | JSON array (`application/json`, no-store) |
| GET | `/doc` | public | — | — | JSON index of documentation endpoints |
| GET | `/doc/openapi.json` | public | — | — | OpenAPI 3.0 specification |
| POST | `/admin/auth/login` | public | auth | body: `{ email, password }` | `{ token, user }` |
| GET | `/admin/queue` | moderator | — | query: `status`, `page`, `per_page` | paginated queue |
| POST | `/admin/reports/decide` | moderator | — | body: moderation decision | updated report |
| POST | `/admin/evidence/review` | moderator | — | body: evidence review | updated evidence |
| GET | `/admin/stats/overview` | admin | — | — | aggregate counts |
| GET | `/admin/stats/duplicates` | admin | — | — | duplicate groups |
| GET | `/admin/stats/clusters` | admin | — | — | coordinated clusters |

---

## Public endpoints

### `GET /health`

Liveness + database check. Runs `SELECT 1`.

Response `200`:

```json
{ "status": "ok", "database": "up", "time": "2026-08-20T00:00:00.000Z" }
```

If the database is unreachable: `503` with `database: "down"` and the standard error envelope.

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
      "slug": "driving-licence",
      "name": "Driving Licence",
      "department": "Transport",
      "state": "Uttar Pradesh",
      "district": "Varanasi",
      "report_count": 284
    }
  ]
}
```

Invalid `per_page` (e.g. `1000`) returns `400`.

### `GET /services`

List services with the same query schema as `/search` (returns `{ total, items }` of `slug`, `name`, `department`, `description`). With no filters it returns all seeded services (12 at launch).

### `GET /services/:slug`

Service detail. Returns the official block, its government sources, the citizen-experience aggregates, and the standard notice.

```json
{
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
}
```

The `citizen` block is computed over reports with status `validated | corroborated | evidence_backed | officially_acknowledged` for that service (optionally filtered to a district). It is only `published: true` when the report set has **≥ 3 reports from ≥ 2 distinct IP-hash buckets** for the same (service, district) cell; otherwise all statistics are `null` and `published` is `false`, while `report_count` still shows the actual count. See [`docs/methodology.md`](methodology.md) for the aggregate definitions. Unknown slug returns `404`.

### `GET /states`

```json
[ { "id": "…", "code": "UP", "name": "Uttar Pradesh" } ]
```

### `GET /states/:code/districts`

Districts of the state identified by its ISO 3166-2:IN code (e.g. `UP`). Unknown code returns `404`.

```json
[ { "id": "…", "code": "UP01", "name": "Agra" } ]
```

### `GET /districts/:districtId/cities`

Cities of a district by district UUID.

```json
[ { "id": "…", "name": "Agra" } ]
```

### `GET /departments`

```json
[ { "slug": "rto", "name": "Road Transport Office", "category": "Transport" } ]
```

### `POST /reports`

Submit an anonymous citizen report. Public, but rate-limited to **3 requests/hour per IP**. On success the response contains a one-time `submission_token` — the reporter must keep it to check status later; only its `sha256` digest is stored.

Request body — validated by `reportSubmissionSchema` (see the machine-readable schema at `data/schemas/report.schema.json` and the column semantics in [`docs/data-dictionary.md`](data-dictionary.md)):

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `service_id` | uuid | yes | an existing service |
| `state_id` | uuid | yes | an existing state |
| `district_id` | uuid | yes | an existing district |
| `office_id` | uuid | no | nullable; internal reference, never exported |
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
{ "public_id": "R-a1b2c3d4", "status": "submitted", "submission_token": "<one-time>" }
```

`public_id` matches `R-[a-z0-9]{8}`. Unknown `service_id`/`state_id`/`district_id` returns `404`; a description shorter than 30 characters, a negative fee, or `period_end < period_start` returns `400`. The report enters status `submitted` and is screened by the anti-abuse system and the moderation queue (see [`docs/moderation.md`](moderation.md)). The API hashes the submitter's IP and any `x-device-fingerprint` header to `sha256` digests — raw identifiers are never stored or returned (see [`docs/privacy.md`](privacy.md)).

### `GET /reports/:publicId/status`

Status lookup for a reporter, authenticated by the one-time token.

Query: `token=<submission_token>`. The server compares the `sha256` of the provided token with the stored digest.

```json
{ "public_id": "R-a1b2c3d4", "status": "validated", "status_changed_at": "2026-08-20T00:00:00.000Z" }
```

Wrong token (or a token whose hash does not match) returns `404` — deliberately identical to an unknown report id.

### `GET /reports/:publicId`

Public report view: service/state/district names, dates, amounts, `visits`, `delay_days`, the **redacted** description, the list of evidence file metadata, and the report status. Contains no PII fields (no IP hash, device hash, token, or office).

### `POST /evidence`

Upload a supporting file for a report. Public, rate-limited to **10 requests/hour per IP**. Body is `multipart/form-data`; the file part must be a `File` ≤ 20 MB. The file is stored through the configured storage adapter (`local` or `supabase`) under a private key, its `sha256` is computed and recorded, and the evidence row is created in status `pending_review` with:

> `retention_until = now + 90 days`

Response `201`:

```json
{ "id": "<uuid>", "status": "pending_review", "retention_until": "2026-11-18T00:00:00.000Z" }
```

Oversized files (> 20 MB), missing file parts, or evidence for an unknown report return `400`/`404`. Evidence is reviewed by moderators (`POST /admin/evidence/review`) and auto-deleted after retention expires.

### `GET /evidence/:id`

Evidence **metadata only** — id, status, mime type, size, `retention_until` — never the file content and never for non-public statuses. Used by the public report view to list attached evidence.

### `GET /datasets`

Dataset index.

```json
{
  "datasets": [
    { "name": "reports", "format": "csv", "url": "/datasets/reports.csv" },
    { "name": "reports", "format": "json", "url": "/datasets/reports.json" }
  ],
  "generated_at": "2026-08-20T00:00:00.000Z",
  "license": "CC BY 4.0 (data) / MIT (code) — see docs/methodology.md",
  "notice": "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing."
}
```

### `GET /datasets/reports.csv`

The full public dataset as RFC 4180 CSV. Content type `text/csv`, served with `Cache-Control: no-store`. Column order and semantics match the data dictionary exactly.

### `GET /datasets/reports.json`

The same dataset as a JSON array of objects. Money values are decimal strings. Content type `application/json`, `Cache-Control: no-store`.

Both exports contain **only published reports** (statuses `validated`, `corroborated`, `evidence_backed`, `officially_acknowledged`) and **never** `ip_hash`, device hashes, token hashes, or office identifiers. See [`docs/data-dictionary.md`](data-dictionary.md) and [`docs/mirroring.md`](mirroring.md).

### `GET /doc`

JSON index of machine-readable documentation:

```json
{ "openapi": "/doc/openapi.json", "datasets": "/datasets", "data_dictionary": "docs/data-dictionary.md" }
```

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

---

## Versioning and stability

The public routes (`/search`, `/services`, `/locations`, `/reports`, `/evidence`, `/datasets`, `/doc`) are the stable contract. The data dictionary and the OpenAPI spec must be updated in the same change as any alteration to them — see [`docs/data-dictionary.md`](data-dictionary.md) §7.