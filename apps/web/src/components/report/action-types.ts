/**
 * Serializable result types for the report server actions. Kept out of the
 * `"use server"` module because a server-action file may only export async
 * functions — these are shared by the client wizard and the status form.
 */

import type { ReportStatus } from "@/lib/api/types";

export type SubmitFailureCode = "validation" | "not_found" | "rate_limited" | "network" | "error";

export type SubmitActionResult =
  | { ok: true; publicId: string; token: string; status: ReportStatus }
  | {
      ok: false;
      code: SubmitFailureCode;
      message: string;
      /** Field-keyed messages, using wizard field names (e.g. `serviceSlug`). */
      fieldErrors?: Record<string, string>;
      /** Network/timeout failures can simply be retried. */
      retryable: boolean;
    };

export type EvidenceActionResult =
  | { ok: true; status: string; retentionUntil: string }
  | { ok: false; message: string };

export type StatusActionResult =
  | { ok: true; publicId: string; status: ReportStatus; statusChangedAt: string }
  | { ok: false; code: "not_found" | "unreachable" | "invalid"; message: string };
