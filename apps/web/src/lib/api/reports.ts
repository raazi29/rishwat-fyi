/**
 * Reports + evidence resources.
 *
 * Mutations (`submitReport`, `uploadEvidence`) return `ApiResult` directly and
 * NEVER fall back to sample data — a submission must never be faked. Callers
 * inspect `error.code`:
 *   - `submitReport`   → `too_many_requests` means the 3-per-hour-per-IP limit
 *                        was hit (surface it distinctly, not as a generic error).
 *   - `uploadEvidence` → `too_many_requests` is the 10-per-hour-per-IP limit.
 *
 * Reporter-specific reads (`getReportStatus`, `getPublicReport`) use
 * `revalidate: 0` and only substitute sample data for known sample reports; a
 * wrong token or unknown id returns `null` (indistinguishable, by design).
 */

import {
  apiFetch,
  buildUrl,
  withSampleUnlessMissing,
  type ApiResult,
  type Sourced,
} from "./client";
import type {
  ApiErrorBody,
  EvidenceMeta,
  PublicReport,
  ReportStatusResponse,
  ReportSubmission,
  ReportSubmissionResponse,
} from "./types";
import { findPublicReport, getSampleReportStatus } from "@/lib/fixtures/reports";

const EVIDENCE_UPLOAD_TIMEOUT_MS = 30_000;

/** `POST /reports`. Rate-limited to 3/hour/IP (`too_many_requests`). */
export function submitReport(body: ReportSubmission): Promise<ApiResult<ReportSubmissionResponse>> {
  return apiFetch<ReportSubmissionResponse>("/reports", { method: "POST", body, revalidate: 0 });
}

/** Reporter status lookup. Wrong/absent token → `null` (same as unknown id). */
export function getReportStatus(
  publicId: string,
  token: string,
): Promise<Sourced<ReportStatusResponse> | null> {
  return withSampleUnlessMissing(
    () =>
      apiFetch<ReportStatusResponse>(`/reports/${encodeURIComponent(publicId)}/status`, {
        headers: { "x-report-token": token },
        revalidate: 0,
      }),
    () => getSampleReportStatus(publicId, token),
  );
}

/** Public report view. `null` on a real 404. */
export function getPublicReport(publicId: string): Promise<Sourced<PublicReport> | null> {
  return withSampleUnlessMissing(
    async (): Promise<ApiResult<PublicReport>> => {
      const raw = await apiFetch<unknown>(`/reports/${encodeURIComponent(publicId)}`, { revalidate: 0 });
      if (!raw.ok) return raw as ApiResult<PublicReport>;
      const normalized = normalizePublicReport(raw.data);
      if (!normalized) {
        return {
          ok: false,
          error: { code: "invalid_response", message: `Report "${publicId}" returned an unexpected shape.` },
        };
      }
      return { ok: true, data: normalized };
    },
    () => findPublicReport(publicId),
  );
}

function normalizeEvidenceMeta(raw: unknown): EvidenceMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const mime_type = typeof r.mime_type === "string" ? r.mime_type : typeof r.mimeType === "string" ? (r.mimeType as string) : null;
  const size_bytes = typeof r.size_bytes === "number" ? r.size_bytes : typeof r.sizeBytes === "number" ? (r.sizeBytes as number) : null;
  const status = typeof r.status === "string" ? r.status : "accepted";
  // live API may return `retention_until` or `uploaded_at`+`sha256`; fixtures use `retention_until`
  const retention_until =
    typeof r.retention_until === "string"
      ? r.retention_until
      : typeof r.uploaded_at === "string"
        ? new Date(new Date(r.uploaded_at as string).getTime() + 90 * 24 * 3600 * 1000).toISOString()
        : new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
  if (!id || !mime_type || size_bytes === null) return null;
  return {
    id,
    status: status as EvidenceMeta["status"],
    mime_type,
    size_bytes,
    retention_until,
  };
}

/**
 * Adapt the live API's nested `GET /reports/:publicId` shape to the web's flat
 * `PublicReport` view model. Handles BOTH shapes defensively so pages never
 * crash regardless of which backend is deployed.
 *
 * Live (per apps/api/src/routes/reports.ts):
 *   { public_id, status, service:{slug,name}, location:{state,district}, period:{start,end}, experience:{...}, description, evidence:[], created_at }
 * Web (fixtures + PublicReportView):
 *   { public_id, status, service, state, district, period_start, period_end, official_fee_reported_inr..., paid, delay_days, visits, description, evidence, submitted_at, status_changed_at }
 */
function normalizePublicReport(raw: unknown): PublicReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Already flat web shape? (fixture)
  if ("period_start" in r && "state" in r && "service" in r && typeof r.service === "object") {
    const maybe = raw as PublicReport;
    if (typeof maybe.public_id === "string" && typeof maybe.service?.slug === "string") {
      const ev = Array.isArray(maybe.evidence) ? maybe.evidence : [];
      return { ...maybe, evidence: ev.filter((e) => !!e && typeof e.id === "string") };
    }
  }

  // Live nested shape
  const public_id = typeof r.public_id === "string" ? r.public_id : "";
  const status = typeof r.status === "string" ? r.status : "submitted";
  if (!public_id) return null;

  const serviceRaw = r.service as Record<string, unknown> | undefined;
  const service =
    serviceRaw && typeof serviceRaw.slug === "string" && typeof serviceRaw.name === "string"
      ? { slug: serviceRaw.slug as string, name: serviceRaw.name as string }
      : null;
  if (!service) return null;

  const locationRaw = r.location as Record<string, unknown> | undefined;
  const state = typeof locationRaw?.state === "string" ? (locationRaw.state as string) : typeof r.state === "string" ? (r.state as string) : "";
  const district = typeof locationRaw?.district === "string" ? (locationRaw.district as string) : typeof r.district === "string" ? (r.district as string) : "";

  const periodRaw = r.period as Record<string, unknown> | undefined;
  const period_start =
    typeof periodRaw?.start === "string"
      ? (periodRaw.start as string)
      : typeof r.period_start === "string"
        ? (r.period_start as string)
        : "";
  const period_end =
    typeof periodRaw?.end === "string"
      ? (periodRaw.end as string)
      : typeof r.period_end === "string"
        ? (r.period_end as string)
        : "";

  const expRaw = r.experience as Record<string, unknown> | undefined;
  const official_fee_reported_inr =
    (expRaw?.official_fee_reported_inr as string | null) ?? (r.official_fee_reported_inr as string | null) ?? null;
  const additional_amount_reported_inr =
    (expRaw?.additional_amount_reported_inr as string | null) ?? (r.additional_amount_reported_inr as string | null) ?? null;
  const amount_paid_inr = (expRaw?.amount_paid_inr as string | null) ?? (r.amount_paid_inr as string | null) ?? null;
  const paid = typeof expRaw?.paid === "boolean" ? (expRaw.paid as boolean) : typeof r.paid === "boolean" ? (r.paid as boolean) : false;
  const delay_days = (expRaw?.delay_days as number | null) ?? (r.delay_days as number | null) ?? null;
  const visits = (expRaw?.visits as number | null) ?? (r.visits as number | null) ?? null;

  const description = typeof r.description === "string" ? r.description : "";
  const submitted_at =
    typeof r.submitted_at === "string"
      ? r.submitted_at
      : typeof r.created_at === "string"
        ? (r.created_at as string)
        : new Date().toISOString();
  const status_changed_at =
    typeof r.status_changed_at === "string"
      ? r.status_changed_at
      : typeof r.created_at === "string"
        ? (r.created_at as string)
        : submitted_at;

  const evidenceRaw = Array.isArray(r.evidence) ? r.evidence : [];
  const evidence: EvidenceMeta[] = [];
  for (const item of evidenceRaw) {
    const m = normalizeEvidenceMeta(item);
    if (m) evidence.push(m);
  }

  return {
    public_id,
    status: status as PublicReport["status"],
    service,
    state,
    district,
    period_start,
    period_end,
    official_fee_reported_inr,
    additional_amount_reported_inr,
    amount_paid_inr,
    paid,
    delay_days,
    visits,
    description,
    evidence,
    submitted_at,
    status_changed_at,
  };
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * `POST /evidence` (multipart). Needs its own fetch — the shared client
 * JSON-encodes bodies. Never falls back to sample. Rate-limited to 10/hour/IP.
 */
export async function uploadEvidence(form: FormData): Promise<ApiResult<EvidenceMeta>> {
  // Resolve the URL before the try: a misconfigured base URL (see `apiBaseUrl`)
  // must propagate as a loud, descriptive error, not be swallowed into the
  // generic "API could not be reached" below.
  const url = buildUrl("/evidence");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EVIDENCE_UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const text = await response.text();
    let parsed: unknown = null;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = undefined;
      }
    }
    if (!response.ok) {
      if (isApiErrorBody(parsed)) {
        return {
          ok: false,
          error: { code: parsed.error.code, message: parsed.error.message, status: response.status },
        };
      }
      return {
        ok: false,
        error: {
          code: "invalid_response",
          message: `Unexpected ${response.status} response from the API.`,
          status: response.status,
        },
      };
    }
    if (parsed === undefined || parsed === null) {
      return { ok: false, error: { code: "invalid_response", message: "The API returned malformed JSON." } };
    }
    return { ok: true, data: parsed as EvidenceMeta };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      error: {
        code: aborted ? "timeout" : "network_error",
        message: aborted ? "The evidence upload timed out." : "The API could not be reached.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
