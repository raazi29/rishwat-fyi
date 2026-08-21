# Data Dictionary — Public Dataset Columns

Reference for the **reports** dataset published by Rishwat.fyi — the structured, anonymized
public record of citizen-reported experiences with government services in India.

This document is the human-readable form of the dataset contract. The machine-readable
form of the report submission schema lives at [`data/schemas/report.schema.json`](../data/schemas/report.schema.json),
and the API that serves this data is documented in [`api.md`](api.md).

---

## 1. Dataset scope

The dataset contains **one row per published report**. A report is published — and therefore
exported — only when its status is one of:

| Status | Meaning |
|---|---|
| `validated` | Reviewed by a moderator and kept |
| `corroborated` | Auto-corroborated by ≥ 2 independent reports (distinct IP-hash buckets, same service + district, last 180 days) |
| `evidence_backed` | Corroborated **and** accepted evidence attached |
| `officially_acknowledged` | Official response/source acknowledged by a moderator |

Excluded from the dataset:

- `submitted` — not yet moderated
- `rejected` — moderated out
- `withdrawn` — withdrawn by the reporter (or moderated out)

A `submitted` report enters the dataset only after it transitions to one of the four
publishable statuses. See [`methodology.md`](methodology.md) for the status ladder and the
publishing-threshold rules for aggregates.

## 2. License

- **Data (the exported rows):** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribution required. See [`LICENSE-DATA`](../LICENSE-DATA).
- **Code (schemas, exports, and everything in this repository):** MIT. See [`LICENSE`](../LICENSE).

See [`LICENSE`](../LICENSE) and [`LICENSE-DATA`](../LICENSE-DATA) for the full terms, and the `license` field of
[`GET /datasets`](api.md#get-datasets) in the API response.

## 3. Redaction policy

The `description` column is the raw report description passed through
`apps/api/src/utils/redaction.ts` **before** export. The redactor deterministically replaces:

- Aadhaar numbers (12 digits)
- Indian mobile numbers (10 digits, optional `+91` prefix)
- Email addresses
- 16-digit card numbers

with the literal token `[REDACTED]`. Redaction order matters (email patterns are matched
before phone patterns) and is applied on every export — the raw description is never
exported. See [`privacy.md`](privacy.md) for the full do-not-publish list.

## 4. Fields that are NEVER exported

The export is deliberately scoped to the 17 columns below. The following database columns
exist for abuse detection and tracking but are **never** present in any export, CSV, or JSON
response:

- `ip_hash` — SHA-256 digest of the reporter's IP
- `device_fingerprint_hash` — SHA-256 digest of the device fingerprint
- `submission_token_hash` — SHA-256 digest of the one-time submission token
- any `office_*` fields — office identifiers and locations are internal reference data

See [`privacy.md`](privacy.md) and the PII rule in the backend plan (never store raw IP /
device fingerprint / submission token — store SHA-256 hex digests only; never return them).

## 5. Formats

### JSON (`reports.json`)

An **object** of the shape `{ "total": <n>, "rows": [ … ] }`, where `rows` is an array of
objects (one per report) and `total` equals `rows.length`. Keys are **snake_case** and match
the column names in this document exactly. Money values are exported as **decimal strings**
(e.g. `"1500.00"`), never as floats, to preserve the exact `numeric(12,2)` precision.

```json
{
  "total": 1,
  "rows": [
    {
      "public_id": "R-a1b2c3d4",
      "service_slug": "driving-licence",
      "service_name": "Driving Licence",
      "department": "Transport Department (RTO)",
      "state": "Uttar Pradesh",
      "district": "Agra",
      "period_start": "2026-05-01",
      "period_end": "2026-05-31",
      "official_fee_reported_inr": "600.00",
      "additional_amount_reported_inr": "1500.00",
      "amount_paid_inr": "2100.00",
      "paid": true,
      "delay_days": 45,
      "visits": 3,
      "status": "validated",
      "description": "Had to pay extra to the agent. Contact [REDACTED] for details.",
      "created_at": "2026-06-02T10:15:00.000Z"
    }
  ]
}
```

### CSV (`reports.csv`)

A single header row followed by one row per report, quoted per **RFC 4180**: fields
containing a comma, double quote, CR or LF are wrapped in double quotes with embedded quotes
doubled; records are separated by **CRLF** (`\r\n`) and the body ends with a trailing CRLF.
Column order is exactly the order in the reference below.

```
public_id,service_slug,service_name,department,state,district,period_start,period_end,official_fee_reported_inr,additional_amount_reported_inr,amount_paid_inr,paid,delay_days,visits,status,description,created_at
R-a1b2c3d4,driving-licence,Driving Licence,Transport Department (RTO),Uttar Pradesh,Agra,2026-05-01,2026-05-31,600.00,1500.00,2100.00,true,45,3,validated,Had to pay extra to the agent. Contact [REDACTED] for details.,2026-06-02T10:15:00.000Z
```

Both exports are served with `Cache-Control: public, max-age=300` (see [`api.md`](api.md#get-datasets-reports-csv)).
The dataset contains only already-published reports and changes slowly, so a short shared
cache lets mirrors and CDNs serve it efficiently.

## 6. Column reference

Quick reference (exact names and order of the export projection):

| # | Column | Type | Nullable | Privacy |
|---|---|---|---|---|
| 1 | `public_id` | text | no | public |
| 2 | `service_slug` | text | no | public |
| 3 | `service_name` | text | no | public |
| 4 | `department` | text | no | public |
| 5 | `state` | text | no | public |
| 6 | `district` | text | no | public |
| 7 | `period_start` | date | no | public |
| 8 | `period_end` | date | no | public |
| 9 | `official_fee_reported_inr` | numeric(12,2) | yes | public |
| 10 | `additional_amount_reported_inr` | numeric(12,2) | yes | public |
| 11 | `amount_paid_inr` | numeric(12,2) | yes | public |
| 12 | `paid` | boolean | no | public |
| 13 | `delay_days` | integer | yes | public |
| 14 | `visits` | integer | yes | public |
| 15 | `status` | enum | no | public |
| 16 | `description` | text | no | redacted |
| 17 | `created_at` | timestamp | no | public |

Detailed reference — one table per column.

### 6.1 `public_id`

| | |
|---|---|
| **Type** | text (`R-` + 8 random base36 characters) |
| **Description** | Stable public identifier for the report, used in URLs and tracking lookups. Not an auto-increment; never reveals submission order or the reporter. |
| **Example** | `R-a1b2c3d4` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Pattern `R-[a-z0-9]{8}`. Unique in the database. |

### 6.2 `service_slug`

| | |
|---|---|
| **Type** | text (kebab-case) |
| **Description** | Machine-readable slug of the government service the report is about. Join key to `services.slug` in the catalog. |
| **Example** | `driving-licence` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Same value as on the service pages and search results. |

### 6.3 `service_name`

| | |
|---|---|
| **Type** | text |
| **Description** | Human-readable name of the service (e.g. "Driving Licence", "Land Registration"). Denormalized into the export for convenience. |
| **Example** | `Driving Licence` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Join `services.slug → services.name`. |

### 6.4 `department`

| | |
|---|---|
| **Type** | text |
| **Description** | Name of the government department responsible for the service. |
| **Example** | `Transport Department (RTO)` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Join `services.department_id → departments.name`. |

### 6.5 `state`

| | |
|---|---|
| **Type** | text |
| **Description** | Full name of the state where the experience happened. The export carries the state **name** only — there is no separate state-code column. |
| **Example** | `Uttar Pradesh` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Join `reports.state_id → states.name`. The ISO 3166-2:IN code is available from the API (`GET /locations/states`) but is not part of the export. |

### 6.6 `district`

| | |
|---|---|
| **Type** | text |
| **Description** | Name of the district within the state where the experience happened. The export carries the district **name** only. |
| **Example** | `Agra` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Join `reports.district_id → districts.name`. |

### 6.7 `period_start`

| | |
|---|---|
| **Type** | date (`YYYY-MM-DD`) |
| **Description** | Start of the period the report covers. |
| **Example** | `2026-05-01` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | `period_end` must be ≥ `period_start` (enforced at submission). |

### 6.8 `period_end`

| | |
|---|---|
| **Type** | date (`YYYY-MM-DD`) |
| **Description** | End of the period the report covers. |
| **Example** | `2026-05-31` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Must be ≥ `period_start` (enforced at submission). |

### 6.9 `official_fee_reported_inr`

| | |
|---|---|
| **Type** | money — `numeric(12,2)` INR; exported as decimal string |
| **Description** | The official fee for the service as reported by the citizen. |
| **Example** | `600.00` |
| **Nullable** | yes |
| **Privacy class** | public |
| **Notes** | Range 0–10,000,000, multiple of 0.01 at submission. Contrast with `additional_amount_reported_inr` to compute the "gap". |

### 6.10 `additional_amount_reported_inr`

| | |
|---|---|
| **Type** | money — `numeric(12,2)` INR; exported as decimal string |
| **Description** | The additional (unofficial) amount the citizen reports being asked to pay. |
| **Example** | `1500.00` |
| **Nullable** | yes |
| **Privacy class** | public |
| **Notes** | Range 0–10,000,000, multiple of 0.01. Key input to the median-extra-payment aggregate. |

### 6.11 `amount_paid_inr`

| | |
|---|---|
| **Type** | money — `numeric(12,2)` INR; exported as decimal string |
| **Description** | Total amount the citizen reports actually paying for the service. |
| **Example** | `2100.00` |
| **Nullable** | yes |
| **Privacy class** | public |
| **Notes** | Range 0–10,000,000, multiple of 0.01. If `paid` is `false`, this is expected to be `null`. |

### 6.12 `paid`

| | |
|---|---|
| **Type** | boolean |
| **Description** | Whether the citizen reports paying anything (of any kind) for the service. |
| **Example** | `true` |
| **Nullable** | no (default `false`) |
| **Privacy class** | public |
| **Notes** | Not a verdict — a reported fact. |

### 6.13 `delay_days`

| | |
|---|---|
| **Type** | integer (0–3650) |
| **Description** | Number of days the citizen reports the service taking beyond the official timeline. |
| **Example** | `45` |
| **Nullable** | yes |
| **Privacy class** | public |
| **Notes** | `null` when no delay was reported. Range 0–3650 at submission. Key input to the median-delay aggregate. |

### 6.14 `visits`

| | |
|---|---|
| **Type** | integer (1–50) |
| **Description** | Number of office visits the citizen reports making for the service. |
| **Example** | `3` |
| **Nullable** | yes |
| **Privacy class** | public |
| **Notes** | `null` when not reported. Range 1–50 at submission. Input to the average-visits aggregate. |

### 6.15 `status`

| | |
|---|---|
| **Type** | enum (report status) |
| **Description** | Verification status at the time of export. Only publishable statuses appear in the dataset. |
| **Example** | `validated` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Values: `validated`, `corroborated`, `evidence_backed`, `officially_acknowledged` (see section 1; `submitted`, `rejected`, `withdrawn` never appear). |

### 6.16 `description`

| | |
|---|---|
| **Type** | text |
| **Description** | The citizen's free-text description of the experience, with PII redacted via `apps/api/src/utils/redaction.ts`. The column is named `description`; its exported content is always the redacted form. |
| **Example** | `Had to pay extra to the agent. Contact [REDACTED] for details.` |
| **Nullable** | no |
| **Privacy class** | **redacted** |
| **Notes** | The only column with privacy class `redacted`. Aadhaar, mobile numbers, emails, and card numbers are replaced with `[REDACTED]`. The raw description is never exported. |

### 6.17 `created_at`

| | |
|---|---|
| **Type** | timestamp (with time zone) — ISO 8601 UTC |
| **Description** | When the report was submitted. Useful for freshness analysis. |
| **Example** | `2026-06-02T10:15:00.000Z` |
| **Nullable** | no |
| **Privacy class** | public |
| **Notes** | Reflects submission time, not the time the status became publishable. |

---

## 7. Stability

The column names, order, and types in this document are the contract with
`apps/api/src/services/export.service.ts` (`exportRows` / `EXPORT_COLUMNS` / `toCsv`), which
is the single source of truth for both the CSV and JSON exports (`apps/api/src/routes/datasets.ts`
reuses it — it does not maintain its own copy). The projection is covered by
`apps/api/test/datasets.test.ts`, which asserts the exact CSV header row and the exact JSON
object keys so this document cannot silently drift from the code. Any change to the export
projection must be made in `export.service.ts` and reflected here and in the OpenAPI spec
served at `/doc/openapi.json`.
