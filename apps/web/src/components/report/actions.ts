"use server";

/**
 * Server actions for the report flow. Data access stays on the server (build
 * contract): these call `submitReport`, `uploadEvidence` and `getReportStatus`
 * from `@/lib/api` and return plain, serializable results.
 *
 * Submission is a mutation and NEVER falls back to sample data. The status
 * lookup must also never present sample data as live (a `source: "sample"`
 * result means the API was unreachable, so it becomes a real error state).
 */

import { getReportStatus, submitReport, uploadEvidence } from "@/lib/api";
import type { ReportSubmission } from "@/lib/api/types";
import { publicIdSchema, reportSubmissionSchema } from "@rishwat/validation";

import type { EvidenceActionResult, StatusActionResult, SubmitActionResult } from "./action-types";
import { fieldForSchemaPath } from "./wizard-validation";

/** `POST /reports`. Maps every documented outcome to a client-friendly result. */
export async function submitReportAction(payload: ReportSubmission): Promise<SubmitActionResult> {
  const parsed = reportSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = typeof issue.path[0] === "string" ? fieldForSchemaPath(issue.path[0]) : null;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      code: "validation",
      message: "Some answers need a quick fix before this can be sent.",
      fieldErrors,
      retryable: false,
    };
  }

  const result = await submitReport(parsed.data);
  if (result.ok) {
    return {
      ok: true,
      publicId: result.data.public_id,
      token: result.data.token,
      status: result.data.status,
    };
  }

  switch (result.error.code) {
    case "too_many_requests":
      return {
        ok: false,
        code: "rate_limited",
        message:
          "You can submit up to 3 reports per hour from one connection. Your report is saved as a draft \u2014 please try again a little later.",
        retryable: false,
      };
    case "not_found":
      return {
        ok: false,
        code: "not_found",
        message:
          "We couldn\u2019t match the service or location you selected. Please reopen step 1 and choose them again.",
        fieldErrors: { serviceSlug: "This selection was not recognised. Please choose it again." },
        retryable: false,
      };
    case "bad_request":
      return {
        ok: false,
        code: "validation",
        message: result.error.message || "Some answers could not be accepted. Please review your report.",
        retryable: false,
      };
    case "network_error":
    case "timeout":
      return {
        ok: false,
        code: "network",
        message: "We couldn\u2019t reach the server. Your report is kept as a draft \u2014 you can retry.",
        retryable: true,
      };
    default:
      return {
        ok: false,
        code: "error",
        message: "Something went wrong while submitting. Your report is kept as a draft \u2014 you can retry.",
        retryable: true,
      };
  }
}

/**
 * `POST /evidence`. Best-effort and non-blocking: the report already exists by
 * the time this runs, so any failure is reported softly and the reporter is
 * told they can add evidence later. Never throws.
 */
export async function uploadEvidenceAction(form: FormData): Promise<EvidenceActionResult> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No file was attached." };
  }
  const result = await uploadEvidence(form);
  if (result.ok) {
    return { ok: true, status: result.data.status, retentionUntil: result.data.retention_until };
  }
  return {
    ok: false,
    message:
      result.error.code === "too_many_requests"
        ? "The evidence upload limit was reached. You can attach this file to your report later."
        : "We couldn\u2019t attach your file automatically. You can add it to your report later.",
  };
}

/**
 * Reporter status lookup. A wrong token and an unknown id are deliberately
 * indistinguishable (both `not_found`). Because this route must never show
 * sample data as live, a `source: "sample"` result (API unreachable) becomes an
 * `unreachable` error rather than a status.
 */
export async function checkStatusAction(publicId: string, token: string): Promise<StatusActionResult> {
  const id = publicId.trim();
  const cleanToken = token.trim();
  if (!publicIdSchema.safeParse(id).success || cleanToken.length === 0) {
    return {
      ok: false,
      code: "invalid",
      message: "Enter a report ID in the form R-xxxxxxxx together with the one-time token you were given.",
    };
  }

  const result = await getReportStatus(id, cleanToken);
  if (result === null) {
    return {
      ok: false,
      code: "not_found",
      message:
        "No report matches that ID and token. For your safety, a wrong token and an unknown ID look exactly the same here.",
    };
  }
  if (result.source === "sample") {
    return {
      ok: false,
      code: "unreachable",
      message: "We couldn\u2019t reach the status service right now. Please try again in a moment.",
    };
  }
  return {
    ok: true,
    publicId: result.data.public_id,
    status: result.data.status,
    statusChangedAt: result.data.status_changed_at,
  };
}
