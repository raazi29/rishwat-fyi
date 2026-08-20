import type { DefinitionItem } from "@/components/doc";

/**
 * The public dataset columns, grouped by entity for the data dictionary.
 * Names, types, nullability, privacy class and descriptions are transcribed
 * from docs/data-dictionary.md §6 exactly. All 18 columns are part of the
 * export projection (Exported: Yes); the fields that are never exported are
 * listed separately on the page (§4).
 */

export interface ColumnGroup {
  id: string;
  title: string;
  items: DefinitionItem[];
}

const exportedPublic = (extra: { label: string; value: string }[] = []) => [
  ...extra,
  { label: "Exported", value: "Yes" },
  { label: "Privacy", value: "public" },
];

export const COLUMN_GROUPS: ColumnGroup[] = [
  {
    id: "grp-identifiers",
    title: "Identifiers and catalogue",
    items: [
      {
        id: "col-public_id",
        term: "public_id",
        facts: exportedPublic([
          { label: "Type", value: "text" },
          { label: "Nullable", value: "No" },
        ]),
        description:
          "Stable public identifier for the report, used in URLs and tracking lookups. Not an auto-increment; never reveals submission order or the reporter. Pattern R-[a-z0-9]{8}, unique in the database.",
      },
      {
        id: "col-service_slug",
        term: "service_slug",
        facts: exportedPublic([
          { label: "Type", value: "text (kebab-case)" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Machine-readable slug of the service the report is about. Join key to services.slug in the catalogue.",
      },
      {
        id: "col-service_name",
        term: "service_name",
        facts: exportedPublic([
          { label: "Type", value: "text" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Human-readable name of the service (e.g. \u201cDriving Licence\u201d). Denormalised into the export for convenience.",
      },
      {
        id: "col-department",
        term: "department",
        facts: exportedPublic([
          { label: "Type", value: "text" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Name of the government department responsible for the service.",
      },
    ],
  },
  {
    id: "grp-location",
    title: "Location",
    items: [
      {
        id: "col-state_code",
        term: "state_code",
        facts: exportedPublic([
          { label: "Type", value: "text (ISO 3166-2:IN)" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Two-letter code of the state where the experience happened.",
      },
      {
        id: "col-state_name",
        term: "state_name",
        facts: exportedPublic([
          { label: "Type", value: "text" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Full name of the state.",
      },
      {
        id: "col-district_name",
        term: "district_name",
        facts: exportedPublic([
          { label: "Type", value: "text" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Name of the district within the state where the experience happened.",
      },
    ],
  },
  {
    id: "grp-period",
    title: "Reporting period",
    items: [
      {
        id: "col-period_start",
        term: "period_start",
        facts: exportedPublic([
          { label: "Type", value: "date" },
          { label: "Unit", value: "YYYY-MM-DD" },
          { label: "Nullable", value: "No" },
        ]),
        description: "Start of the period the report covers.",
      },
      {
        id: "col-period_end",
        term: "period_end",
        facts: exportedPublic([
          { label: "Type", value: "date" },
          { label: "Unit", value: "YYYY-MM-DD" },
          { label: "Nullable", value: "No" },
        ]),
        description: "End of the period the report covers. Must be ≥ period_start (enforced at submission).",
      },
    ],
  },
  {
    id: "grp-money",
    title: "Money",
    items: [
      {
        id: "col-official_fee_reported_inr",
        term: "official_fee_reported_inr",
        facts: exportedPublic([
          { label: "Type", value: "numeric(12,2)" },
          { label: "Unit", value: "INR (decimal string)" },
          { label: "Nullable", value: "Yes" },
        ]),
        description:
          "The official fee for the service as reported by the citizen. Range 0–10,000,000, multiple of 0.01. Contrast with additional_amount_reported_inr to compute the gap.",
      },
      {
        id: "col-additional_amount_reported_inr",
        term: "additional_amount_reported_inr",
        facts: exportedPublic([
          { label: "Type", value: "numeric(12,2)" },
          { label: "Unit", value: "INR (decimal string)" },
          { label: "Nullable", value: "Yes" },
        ]),
        description:
          "The additional (unofficial) amount the citizen reports being asked to pay. Key input to the median-extra-payment aggregate.",
      },
      {
        id: "col-amount_paid_inr",
        term: "amount_paid_inr",
        facts: exportedPublic([
          { label: "Type", value: "numeric(12,2)" },
          { label: "Unit", value: "INR (decimal string)" },
          { label: "Nullable", value: "Yes" },
        ]),
        description:
          "Total amount the citizen reports actually paying for the service. If paid is false, this is expected to be null.",
      },
      {
        id: "col-paid",
        term: "paid",
        facts: exportedPublic([
          { label: "Type", value: "boolean" },
          { label: "Nullable", value: "No (default false)" },
        ]),
        description: "Whether the citizen reports paying anything (of any kind) for the service. Not a verdict — a reported fact.",
      },
    ],
  },
  {
    id: "grp-experience",
    title: "Experience",
    items: [
      {
        id: "col-delay_days",
        term: "delay_days",
        facts: exportedPublic([
          { label: "Type", value: "integer (≥ 0)" },
          { label: "Unit", value: "days" },
          { label: "Nullable", value: "Yes" },
        ]),
        description:
          "Number of days the citizen reports the service taking beyond the official timeline. null when no delay was reported. Key input to the median-delay aggregate.",
      },
      {
        id: "col-visits",
        term: "visits",
        facts: exportedPublic([
          { label: "Type", value: "integer (≥ 0)" },
          { label: "Unit", value: "office visits" },
          { label: "Nullable", value: "Yes" },
        ]),
        description: "Number of office visits the citizen reports making for the service. null when not reported. Input to the average-visits aggregate.",
      },
    ],
  },
  {
    id: "grp-description",
    title: "Description",
    items: [
      {
        id: "col-redacted_description",
        term: "redacted_description",
        facts: [
          { label: "Type", value: "text" },
          { label: "Nullable", value: "No" },
          { label: "Exported", value: "Yes" },
          { label: "Privacy", value: "redacted" },
        ],
        description:
          "The citizen's free-text description of the experience, with PII redacted before export. The only column with privacy class redacted: Aadhaar, mobile numbers, emails and card numbers are replaced with [REDACTED]. The raw description is never exported.",
      },
    ],
  },
  {
    id: "grp-status",
    title: "Status and timing",
    items: [
      {
        id: "col-status",
        term: "status",
        facts: exportedPublic([
          { label: "Type", value: "enum" },
          { label: "Nullable", value: "No" },
        ]),
        description:
          "Verification status at the time of export. Only publishable statuses appear: validated, corroborated, evidence_backed, officially_acknowledged (submitted, rejected and withdrawn never appear).",
      },
      {
        id: "col-created_at",
        term: "created_at",
        facts: exportedPublic([
          { label: "Type", value: "timestamp (tz)" },
          { label: "Unit", value: "ISO 8601 UTC" },
          { label: "Nullable", value: "No" },
        ]),
        description: "When the report was submitted. Useful for freshness analysis. Reflects submission time, not the time the status became publishable.",
      },
    ],
  },
];

/** Fields that exist for abuse detection/tracking but are never in any export (§4). */
export const NEVER_EXPORTED: DefinitionItem[] = [
  {
    id: "col-ip_hash",
    term: "ip_hash",
    facts: [
      { label: "Exported", value: "No" },
      { label: "Privacy", value: "internal" },
    ],
    description: "SHA-256 digest of the reporter's IP. Used only for abuse and duplicate signals; never selected into an export.",
  },
  {
    id: "col-device_fingerprint_hash",
    term: "device_fingerprint_hash",
    facts: [
      { label: "Exported", value: "No" },
      { label: "Privacy", value: "internal" },
    ],
    description: "SHA-256 digest of the device fingerprint. Never selected into an export.",
  },
  {
    id: "col-submission_token_hash",
    term: "submission_token_hash",
    facts: [
      { label: "Exported", value: "No" },
      { label: "Privacy", value: "internal" },
    ],
    description: "SHA-256 digest of the one-time submission token. Never selected into an export.",
  },
  {
    id: "col-office",
    term: "office_*",
    facts: [
      { label: "Exported", value: "No" },
      { label: "Privacy", value: "internal" },
    ],
    description: "Office identifiers and locations are internal reference data and are never exported.",
  },
];
