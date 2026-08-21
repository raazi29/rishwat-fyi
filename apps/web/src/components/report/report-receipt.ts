/**
 * The post-submission "receipt" that the wizard hands to `/report/submitted`.
 *
 * It carries the `public_id`, the one-time `token`, and enough
 * context to render the confirmation screen (service, location, time). It is
 * kept in **sessionStorage**, never in the URL: the token is a one-time secret
 * shown once and only its sha256 digest is stored server-side (PRODUCT.md), so
 * it must not leak into browser history, referrers, or server logs.
 */

import type { ReportStatus } from "@/lib/api/types";

export interface ReportReceipt {
  publicId: string;
  /** One-time token — shown once, cannot be recovered. Never logged or in a URL. */
  token: string;
  status: ReportStatus;
  /** ISO timestamp captured on the client at submit time. */
  submittedAt: string;
  serviceName: string | null;
  serviceType: string | null;
  location: string | null;
  /** True when this is a sample confirmation (API was absent — nothing was sent). */
  sample?: boolean;
  /**
   * Outcome of the optional evidence upload: `true` attached, `false` failed,
   * `undefined` no file was offered. A failed upload must be shown rather than
   * swallowed — the reporter is the only person who still holds the file.
   */
  evidenceAttached?: boolean;
}

/** sessionStorage key. Cleared when the tab closes; survives a same-tab reload. */
export const RECEIPT_STORAGE_KEY = "rishwat:report-receipt:v1";

export function saveReceipt(receipt: ReportReceipt): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
  } catch {
    /* Storage may be unavailable (private mode / quota); the screen still renders. */
  }
}

export function loadReceipt(): ReportReceipt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RECEIPT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReportReceipt>;
    if (!parsed || typeof parsed.publicId !== "string" || typeof parsed.token !== "string") {
      return null;
    }
    return {
      publicId: parsed.publicId,
      token: parsed.token,
      status: (parsed.status as ReportStatus | undefined) ?? "submitted",
      submittedAt: typeof parsed.submittedAt === "string" ? parsed.submittedAt : new Date().toISOString(),
      serviceName: typeof parsed.serviceName === "string" ? parsed.serviceName : null,
      serviceType: typeof parsed.serviceType === "string" ? parsed.serviceType : null,
      location: typeof parsed.location === "string" ? parsed.location : null,
      sample: parsed.sample === true,
      // Tri-state: leave it undefined unless the wizard actually recorded one.
      evidenceAttached: typeof parsed.evidenceAttached === "boolean" ? parsed.evidenceAttached : undefined,
    };
  } catch {
    return null;
  }
}

export function clearReceipt(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RECEIPT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
