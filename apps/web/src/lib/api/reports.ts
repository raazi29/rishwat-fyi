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
    () => apiFetch<PublicReport>(`/reports/${encodeURIComponent(publicId)}`, { revalidate: 0 }),
    () => findPublicReport(publicId),
  );
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
