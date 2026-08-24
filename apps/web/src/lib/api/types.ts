/**
 * Wire types for the Rishwat.fyi API.
 *
 * These mirror `docs/api.md` and `GET /doc/openapi.json` exactly. The API is
 * being built in parallel, so this file is the contract both sides agree on:
 * when the two disagree, the OpenAPI spec wins and this file is corrected.
 *
 * Money is a decimal string (`"1000.00"`), never a number — see docs/api.md
 * §Conventions. Use `parseInr` from `@/lib/format` to render it.
 */

export type Inr = string;
export type IsoDateTime = string;
/** `YYYY-MM-DD` */
export type IsoDate = string;

export type ReportStatus =
  | "submitted"
  | "validated"
  | "corroborated"
  | "evidence_backed"
  | "officially_acknowledged"
  | "rejected"
  | "withdrawn";

/** The five public rungs of the verification ladder, in order. */
export const VERIFICATION_LADDER = [
  "submitted",
  "validated",
  "corroborated",
  "evidence_backed",
  "officially_acknowledged",
] as const satisfies readonly ReportStatus[];

export type VerificationLevel = (typeof VERIFICATION_LADDER)[number];

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

export type ApiErrorCode =
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "bad_request"
  | "conflict"
  | "too_many_requests"
  | "internal_error";

export interface Paginated<T> {
  total: number;
  items: T[];
}

export interface HealthResponse {
  status: "ok" | "degraded";
  database: "up" | "down";
  time: IsoDateTime;
}

/** `GET /search` item. */
export interface SearchResultItem {
  slug: string;
  name: string;
  department: string;
  state: string | null;
  district: string | null;
  report_count: number;
}

/** `GET /services` item. */
export interface ServiceListItem {
  slug: string;
  name: string;
  department: string;
  description: string;
}

export interface OfficialDocument {
  name: string;
  required: boolean;
}

export interface ProcessStep {
  order: number;
  title: string;
  description: string;
}

export interface ServiceDetail {
  slug: string;
  name: string;
  department: string;
  description: string;
  /** `null` when the official fee is slab- or percentage-based. */
  official_fee_inr: Inr | null;
  official_timeline_days: number | null;
  official_visits: number | null;
  official_documents: OfficialDocument[];
  process_steps: ProcessStep[];
}

export interface GovernmentSource {
  url: string;
  title: string;
  last_verified_at: IsoDateTime | null;
}

export interface ServiceSources {
  fee?: GovernmentSource;
  timeline?: GovernmentSource;
  [key: string]: GovernmentSource | undefined;
}

/**
 * Citizen aggregates. Only populated when the (service, district) cell clears
 * the publishing threshold: >= 3 reports from >= 2 distinct IP-hash buckets.
 * Below it every statistic is `null` and `published` is `false`, while
 * `report_count` still reports the true count.
 */
export interface CitizenAggregate {
  published: boolean;
  report_count: number;
  ip_bucket_count: number;
  extra_payment_median: Inr | null;
  delay_median: number | null;
  visits_avg: number | null;
  corroboration_rate: number | null;
  recent_issues: string[];
}

export interface ServiceDetailResponse {
  service: ServiceDetail;
  sources: ServiceSources;
  citizen: CitizenAggregate;
  notice: string;
}

export interface StateRef {
  id: string;
  code: string;
  name: string;
}

export interface DistrictRef {
  id: string;
  code: string;
  name: string;
}

export interface CityRef {
  id: string;
  name: string;
}

/** A district and its cities in `GET /locations/tree`. */
export interface LocationTreeDistrict extends DistrictRef {
  cities: CityRef[];
}

/** A state and its complete district/city hierarchy in `GET /locations/tree`. */
export interface LocationTreeState extends StateRef {
  districts: LocationTreeDistrict[];
}

export interface DepartmentRef {
  slug: string;
  name: string;
  category: string;
}

/**
 * `POST /reports` body — validated by `reportSubmissionSchema`.
 *
 * The service is identified by EITHER `service_id` (uuid) OR `service_slug`
 * (the public slug); exactly one is required. The wizard sends `service_id`.
 */
export interface ReportSubmission {
  service_id?: string;
  service_slug?: string;
  state_id: string;
  district_id: string;
  office_id?: string;
  period_start: IsoDate;
  period_end: IsoDate;
  official_fee_reported_inr?: number;
  additional_amount_reported_inr?: number;
  amount_paid_inr?: number;
  paid?: boolean;
  delay_days?: number;
  visits?: number;
  description: string;
  /**
   * Cloudflare Turnstile CAPTCHA token, attached by the report wizard when
   * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is configured. Verified server-side by the
   * API; omitted entirely when Turnstile is not enabled.
   */
  turnstile_token?: string;
}

export interface ReportSubmissionResponse {
  public_id: string;
  status: ReportStatus;
  /** One-time token. Only its sha256 digest is stored server-side. */
  token: string;
}

export interface ReportStatusResponse {
  public_id: string;
  status: ReportStatus;
  status_changed_at: IsoDateTime;
}

export interface EvidenceMeta {
  id: string;
  status: "pending_review" | "accepted" | "rejected";
  mime_type: string;
  size_bytes: number;
  retention_until: IsoDateTime;
}

export interface PublicReport {
  public_id: string;
  status: ReportStatus;
  service: { slug: string; name: string };
  state: string;
  district: string;
  period_start: IsoDate;
  period_end: IsoDate;
  official_fee_reported_inr: Inr | null;
  additional_amount_reported_inr: Inr | null;
  amount_paid_inr: Inr | null;
  paid: boolean;
  delay_days: number | null;
  visits: number | null;
  /** Server-redacted. Never render un-redacted text. */
  description: string;
  evidence: EvidenceMeta[];
  submitted_at: IsoDateTime;
  status_changed_at: IsoDateTime;
}

export type DatasetFormat = "csv" | "json";

/**
 * One dataset in the `/datasets` index.
 *
 * Mirrors the live API exactly (see docs/api.md → GET /datasets): a dataset is
 * a single logical export, and each available serialisation is a URL under
 * `formats`. The legacy flat shape (`{ name, format, url }`) is still accepted
 * defensively so pages never crash if the fallback fixture or a stale deploy is
 * served — `datasetDownloads` normalises either shape.
 */
export interface DatasetEntry {
  name: string;
  description: string;
  formats: Partial<Record<DatasetFormat, string>>;
  /** @deprecated legacy flat entry — handled by datasetDownloads for backward compat */
  format?: "csv" | "json";
  /** @deprecated legacy flat entry — handled by datasetDownloads for backward compat */
  url?: string;
}

export interface DatasetIndex {
  datasets: DatasetEntry[];
  generated_at: IsoDateTime;
  license: string;
  /** Optional: live API omits it, fixtures may still carry it, pages fall back to MANDATORY_NOTICE */
  notice?: string;
}

/* --- Admin -------------------------------------------------------------- */

export type AdminRole = "moderator" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export interface QueueItem {
  public_id: string;
  status: ReportStatus;
  service_name: string;
  district_name: string;
  state_name: string;
  submitted_at: IsoDateTime;
  evidence_count: number;
  description: string;
  additional_amount_reported_inr: Inr | null;
  delay_days: number | null;
  visits: number | null;
  duplicate_group_id: string | null;
}

export type ModerationAction =
  | "mark_validated"
  | "reject"
  | "acknowledge_officially"
  | "withdraw";

export interface ModerationDecision {
  public_id: string;
  action: ModerationAction;
  reason?: string;
  source_url?: string;
}

export interface AdminStatsOverview {
  total_reports: number;
  published_reports: number;
  pending_review: number;
  rejected: number;
  corroboration_rate: number;
  reports_last_7_days: number;
  states_covered: number;
  services_covered: number;
}

export interface DuplicateGroup {
  group_id: string;
  report_count: number;
  service_slug: string;
  district_name: string;
  oldest: IsoDateTime;
  newest: IsoDateTime;
}

export interface CoordinatedCluster {
  ip_hash_prefix: string;
  service_slug: string;
  report_count: number;
  time_range: { from: IsoDateTime; to: IsoDateTime };
}

/* --- Derived view models (frontend-only) -------------------------------- */

/**
 * A service row in the comparison table: the official figures and the citizen
 * figures for one (service, location) cell, plus the verification level.
 * Assembled by the frontend from `/search` + `/services/:slug`.
 */
export interface ComparisonRow {
  slug: string;
  name: string;
  department: string;
  location: { district: string | null; state: string | null };
  official: {
    fee_inr: Inr | null;
    timeline_days: number | null;
    documents: number | null;
  };
  reported: {
    additional_amount_inr: Inr | null;
    timeline_days: number | null;
    visits: number | null;
  };
  report_count: number;
  verification: VerificationLevel | null;
  published: boolean;
}

/** One state's reported gap, for the choropleth and the leaderboard. */
export interface StateGap {
  code: string;
  name: string;
  /** Median additional amount reported across the state, in rupees. */
  additional_amount_median: Inr | null;
  report_count: number;
  services_covered: number;
  districts_covered: number;
}

export interface PlatformTotals {
  services_tracked: number;
  citizen_reports: number;
  states_covered: number;
  reports_corroborated: number;
}
