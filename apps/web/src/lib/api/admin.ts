/**
 * Admin / moderation resources.
 *
 * These NEVER fall back to sample data — they return `ApiResult` directly. An
 * unauthenticated or under-privileged caller gets `unauthorized` / `forbidden`
 * straight from the API; a moderator UI must handle those explicitly rather
 * than silently rendering fixtures. All calls are uncached (`revalidate: 0`).
 *
 * `decideReport` types the "updated report" response as `ReportStatusResponse`
 * (public_id + new status + timestamp) — the minimal shape the queue needs.
 */

import { apiFetch, apiFetchList, type ApiResult } from "./client";
import type {
  AdminLoginResponse,
  AdminStatsOverview,
  CoordinatedCluster,
  DuplicateGroup,
  EvidenceMeta,
  ModerationDecision,
  Paginated,
  QueueItem,
  ReportStatus,
  ReportStatusResponse,
} from "./types";

export interface QueueQuery {
  status?: ReportStatus;
  page?: number;
  per_page?: number;
}

export interface EvidenceReview {
  evidence_id: string;
  status: "accepted" | "rejected";
  reason?: string;
}

export function adminLogin(
  email: string,
  password: string,
): Promise<ApiResult<AdminLoginResponse>> {
  return apiFetch<AdminLoginResponse>("/admin/auth/login", {
    method: "POST",
    body: { email, password },
    revalidate: 0,
  });
}

export function getQueue(
  token: string,
  query: QueueQuery = {},
): Promise<ApiResult<Paginated<QueueItem>>> {
  return apiFetch<Paginated<QueueItem>>("/admin/queue", {
    query: { status: query.status, page: query.page, per_page: query.per_page },
    token,
    revalidate: 0,
  });
}

export function decideReport(
  token: string,
  decision: ModerationDecision,
): Promise<ApiResult<ReportStatusResponse>> {
  return apiFetch<ReportStatusResponse>("/admin/reports/decide", {
    method: "POST",
    body: decision,
    token,
    revalidate: 0,
  });
}

export function reviewEvidence(
  token: string,
  review: EvidenceReview,
): Promise<ApiResult<EvidenceMeta>> {
  return apiFetch<EvidenceMeta>("/admin/evidence/review", {
    method: "POST",
    body: review,
    token,
    revalidate: 0,
  });
}

export function getStatsOverview(token: string): Promise<ApiResult<AdminStatsOverview>> {
  return apiFetch<AdminStatsOverview>("/admin/stats/overview", { token, revalidate: 0 });
}

export function getDuplicates(token: string): Promise<ApiResult<DuplicateGroup[]>> {
  return apiFetchList<DuplicateGroup>("/admin/stats/duplicates", "groups", { token, revalidate: 0 });
}

export function getClusters(token: string): Promise<ApiResult<CoordinatedCluster[]>> {
  return apiFetchList<CoordinatedCluster>("/admin/stats/clusters", "clusters", { token, revalidate: 0 });
}
