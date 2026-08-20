/**
 * SAMPLE DATA — moderation/admin fixtures. ILLUSTRATIVE, NOT LIVE.
 *
 * These exist so the authenticated admin surfaces can render offline. Note that
 * the admin RESOURCE functions (`lib/api/admin.ts`) NEVER fall back to sample
 * data — they return live `ApiResult`s. These fixtures are for local preview
 * and tests only.
 *
 * `ip_hash_prefix` values are fabricated short hex tokens, never real IPs.
 */

import type {
  AdminStatsOverview,
  CoordinatedCluster,
  DuplicateGroup,
  QueueItem,
} from "@/lib/api/types";
import { sampleCitizenDescriptions } from "./reports";

const d = sampleCitizenDescriptions;

/**
 * Placeholder acknowledgement source for the single `officially_acknowledged`
 * sample report (R-a1b2c3d4). CLEARLY FAKE — not a real government source. No
 * real acknowledgement is implied anywhere in this dataset.
 */
export const samplePlaceholderAcknowledgementSource = "https://example.gov.in/acknowledgement";

/** Moderation queue, oldest first. Mostly `submitted`; two form a duplicate group. */
export const sampleQueue: QueueItem[] = [
  {
    public_id: "R-g7h8i9j0", status: "submitted", service_name: "Driving Licence",
    district_name: "Varanasi", state_name: "Uttar Pradesh", submitted_at: "2026-08-11T08:20:00.000Z",
    evidence_count: 0, description: d[0] ?? "", additional_amount_reported_inr: "2500.00",
    delay_days: 20, visits: 4, duplicate_group_id: null,
  },
  {
    public_id: "R-h8i9j0k1", status: "submitted", service_name: "Land / Property Registration",
    district_name: "Pune", state_name: "Maharashtra", submitted_at: "2026-08-12T10:05:00.000Z",
    evidence_count: 1, description: d[14] ?? "", additional_amount_reported_inr: "4000.00",
    delay_days: 22, visits: 4, duplicate_group_id: null,
  },
  {
    public_id: "R-i9j0k1l2", status: "submitted", service_name: "Driving Licence",
    district_name: "Varanasi", state_name: "Uttar Pradesh", submitted_at: "2026-08-13T09:30:00.000Z",
    evidence_count: 0, description: d[24] ?? "", additional_amount_reported_inr: "2000.00",
    delay_days: 25, visits: 4, duplicate_group_id: "dup-dl-varanasi",
  },
  {
    public_id: "R-j0k1l2m3", status: "submitted", service_name: "Driving Licence",
    district_name: "Varanasi", state_name: "Uttar Pradesh", submitted_at: "2026-08-13T09:34:00.000Z",
    evidence_count: 0, description: d[1] ?? "", additional_amount_reported_inr: "2000.00",
    delay_days: 24, visits: 3, duplicate_group_id: "dup-dl-varanasi",
  },
  {
    public_id: "R-k1l2m3n4", status: "validated", service_name: "Property Mutation (Namantaran)",
    district_name: "Patna", state_name: "Bihar", submitted_at: "2026-08-14T13:15:00.000Z",
    evidence_count: 0, description: d[4] ?? "", additional_amount_reported_inr: "3500.00",
    delay_days: 68, visits: 5, duplicate_group_id: null,
  },
  {
    public_id: "R-l2m3n4o5", status: "submitted", service_name: "Ration Card",
    district_name: "Lucknow", state_name: "Uttar Pradesh", submitted_at: "2026-08-15T11:48:00.000Z",
    evidence_count: 0, description: d[10] ?? "", additional_amount_reported_inr: "400.00",
    delay_days: 20, visits: 3, duplicate_group_id: null,
  },
  {
    public_id: "R-m3n4o5p6", status: "submitted", service_name: "Building Plan Approval / Permit",
    district_name: "Ahmedabad", state_name: "Gujarat", submitted_at: "2026-08-16T15:02:00.000Z",
    evidence_count: 2, description: d[16] ?? "", additional_amount_reported_inr: "9000.00",
    delay_days: 80, visits: 6, duplicate_group_id: null,
  },
];

export const sampleStatsOverview: AdminStatsOverview = {
  total_reports: 2410,
  published_reports: 2293,
  pending_review: 74,
  rejected: 43,
  corroboration_rate: 0.57,
  reports_last_7_days: 38,
  states_covered: 12,
  services_covered: 12,
};

export const sampleDuplicateGroups: DuplicateGroup[] = [
  {
    group_id: "dup-dl-varanasi", report_count: 3, service_slug: "driving-licence",
    district_name: "Varanasi", oldest: "2026-08-13T09:30:00.000Z", newest: "2026-08-13T09:41:00.000Z",
  },
  {
    group_id: "dup-rc-lucknow", report_count: 2, service_slug: "ration-card",
    district_name: "Lucknow", oldest: "2026-08-09T14:10:00.000Z", newest: "2026-08-10T08:55:00.000Z",
  },
];

export const sampleClusters: CoordinatedCluster[] = [
  {
    ip_hash_prefix: "a3f19c", service_slug: "driving-licence", report_count: 7,
    time_range: { from: "2026-08-13T09:20:00.000Z", to: "2026-08-13T10:05:00.000Z" },
  },
  {
    ip_hash_prefix: "7b2e04", service_slug: "land-registration", report_count: 6,
    time_range: { from: "2026-08-10T16:00:00.000Z", to: "2026-08-10T16:48:00.000Z" },
  },
];
