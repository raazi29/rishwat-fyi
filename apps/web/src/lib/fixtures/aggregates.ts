/**
 * SAMPLE DATA — citizen-reported aggregates. ILLUSTRATIVE, NOT LIVE.
 *
 * Every figure below (medians, distributions, visit averages, corroboration
 * rates, report/contributor counts, issue frequencies) is SYNTHETIC sample
 * data, authored to look plausible so the UI can be exercised offline. None of
 * it is a real measurement. Official figures are never here — they live in
 * `service-details.ts`, copied verbatim from the seed.
 *
 * The publishing threshold from `docs/methodology.md` is honoured: a cell is
 * `published: true` only with >= 3 reports from >= 2 independent buckets;
 * below that, `published: false` and every statistic is `null` while the raw
 * `report_count` still shows. See the below-threshold cells at the bottom.
 */

import type { CitizenAggregate, PlatformTotals } from "@/lib/api/types";
import type {
  DistributionBucket,
  FrictionPoint,
  ServiceDistributions,
} from "@/lib/api/view-models";

/** The mandatory notice, verbatim, shown wherever citizen aggregates appear. */
export const CITIZEN_REPORT_NOTICE =
  "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing.";

/** Nationwide default aggregate per service (used when no district is chosen). */
export const sampleServiceCitizen: Record<string, CitizenAggregate> = {
  "driving-licence": {
    published: true, report_count: 284, ip_bucket_count: 176,
    extra_payment_median: "1500.00", delay_median: 21, visits_avg: 3.4,
    corroboration_rate: 0.62, recent_issues: ["additional_payment_requested", "multiple_visits", "unclear_process"],
  },
  "vehicle-registration": {
    published: true, report_count: 141, ip_bucket_count: 92,
    extra_payment_median: "800.00", delay_median: 9, visits_avg: 2.3,
    corroboration_rate: 0.48, recent_issues: ["additional_payment_requested", "multiple_visits"],
  },
  "land-registration": {
    published: true, report_count: 356, ip_bucket_count: 214,
    extra_payment_median: "5000.00", delay_median: 26, visits_avg: 4.1,
    corroboration_rate: 0.68, recent_issues: ["additional_payment_requested", "document_requests_repeated", "multiple_visits"],
  },
  "property-mutation": {
    published: true, report_count: 312, ip_bucket_count: 188,
    extra_payment_median: "3000.00", delay_median: 62, visits_avg: 4.6,
    corroboration_rate: 0.71, recent_issues: ["additional_payment_requested", "multiple_visits", "unclear_process"],
  },
  "building-permit": {
    published: true, report_count: 167, ip_bucket_count: 103,
    extra_payment_median: "8000.00", delay_median: 75, visits_avg: 5.2,
    corroboration_rate: 0.64, recent_issues: ["additional_payment_requested", "document_requests_repeated", "office_staff_unhelpful"],
  },
  "trade-licence": {
    published: true, report_count: 128, ip_bucket_count: 79,
    extra_payment_median: "2000.00", delay_median: 24, visits_avg: 3.1,
    corroboration_rate: 0.5, recent_issues: ["additional_payment_requested", "multiple_visits"],
  },
  "birth-certificate": {
    published: true, report_count: 96, ip_bucket_count: 61,
    extra_payment_median: "300.00", delay_median: 12, visits_avg: 2.0,
    corroboration_rate: 0.41, recent_issues: ["multiple_visits", "unclear_process"],
  },
  "death-certificate": {
    published: true, report_count: 73, ip_bucket_count: 44,
    extra_payment_median: "300.00", delay_median: 10, visits_avg: 1.9,
    corroboration_rate: 0.38, recent_issues: ["multiple_visits", "document_requests_repeated"],
  },
  "police-verification": {
    published: true, report_count: 204, ip_bucket_count: 142,
    extra_payment_median: "500.00", delay_median: 18, visits_avg: 2.2,
    corroboration_rate: 0.55, recent_issues: ["additional_payment_requested", "multiple_visits"],
  },
  "ration-card": {
    published: true, report_count: 189, ip_bucket_count: 118,
    extra_payment_median: "400.00", delay_median: 22, visits_avg: 3.0,
    corroboration_rate: 0.52, recent_issues: ["multiple_visits", "additional_payment_requested", "office_staff_unhelpful"],
  },
  "gst-registration": {
    published: true, report_count: 112, ip_bucket_count: 84,
    extra_payment_median: "1000.00", delay_median: 8, visits_avg: 1.4,
    corroboration_rate: 0.44, recent_issues: ["additional_payment_requested", "unclear_process"],
  },
  "passport": {
    published: true, report_count: 231, ip_bucket_count: 167,
    extra_payment_median: "0.00", delay_median: 6, visits_avg: 1.3,
    corroboration_rate: 0.39, recent_issues: ["multiple_visits", "unclear_process"],
  },
};

function cellKey(slug: string, stateCode: string, districtCode: string): string {
  return `${slug}:${stateCode}:${districtCode}`;
}

/**
 * Specific (service, district) cells. The first are published; the last two are
 * intentionally BELOW threshold (all statistics `null`) — one fails the >= 3
 * reports rule, the other fails the >= 2 independent buckets rule.
 */
export const sampleCellAggregates: Record<string, CitizenAggregate> = {
  [cellKey("driving-licence", "UP", "varanasi")]: {
    published: true, report_count: 47, ip_bucket_count: 31,
    extra_payment_median: "2000.00", delay_median: 24, visits_avg: 3.8,
    corroboration_rate: 0.72, recent_issues: ["additional_payment_requested", "multiple_visits", "unclear_process"],
  },
  [cellKey("driving-licence", "UP", "lucknow")]: {
    published: true, report_count: 33, ip_bucket_count: 22,
    extra_payment_median: "1500.00", delay_median: 18, visits_avg: 3.2,
    corroboration_rate: 0.64, recent_issues: ["additional_payment_requested", "multiple_visits"],
  },
  [cellKey("driving-licence", "DL", "new-delhi")]: {
    published: true, report_count: 29, ip_bucket_count: 24,
    extra_payment_median: "1000.00", delay_median: 12, visits_avg: 2.6,
    corroboration_rate: 0.58, recent_issues: ["additional_payment_requested", "unclear_process"],
  },
  [cellKey("land-registration", "UP", "varanasi")]: {
    published: true, report_count: 38, ip_bucket_count: 26,
    extra_payment_median: "6000.00", delay_median: 30, visits_avg: 4.4,
    corroboration_rate: 0.76, recent_issues: ["additional_payment_requested", "document_requests_repeated", "multiple_visits"],
  },
  [cellKey("land-registration", "MH", "pune")]: {
    published: true, report_count: 41, ip_bucket_count: 28,
    extra_payment_median: "4000.00", delay_median: 21, visits_avg: 3.6,
    corroboration_rate: 0.66, recent_issues: ["additional_payment_requested", "multiple_visits"],
  },
  [cellKey("property-mutation", "BR", "patna")]: {
    published: true, report_count: 36, ip_bucket_count: 23,
    extra_payment_median: "3500.00", delay_median: 71, visits_avg: 5.0,
    corroboration_rate: 0.74, recent_issues: ["additional_payment_requested", "multiple_visits", "office_staff_unhelpful"],
  },
  // BELOW THRESHOLD — only 2 reports (< 3): no statistic may publish.
  [cellKey("police-verification", "WB", "darjeeling")]: {
    published: false, report_count: 2, ip_bucket_count: 2,
    extra_payment_median: null, delay_median: null, visits_avg: null,
    corroboration_rate: null, recent_issues: [],
  },
  // BELOW THRESHOLD — 4 reports but all from 1 IP bucket (< 2 independent).
  [cellKey("death-certificate", "RJ", "ajmer")]: {
    published: false, report_count: 4, ip_bucket_count: 1,
    extra_payment_median: null, delay_median: null, visits_avg: null,
    corroboration_rate: null, recent_issues: [],
  },
};

/** Empty aggregate for a service/cell with no reported data at all. */
export function emptyCitizen(): CitizenAggregate {
  return {
    published: false, report_count: 0, ip_bucket_count: 0,
    extra_payment_median: null, delay_median: null, visits_avg: null,
    corroboration_rate: null, recent_issues: [],
  };
}

/** Resolve the citizen aggregate for a (service[, state, district]) cell. */
export function getSampleCitizen(
  slug: string,
  stateCode?: string,
  districtCode?: string,
): CitizenAggregate {
  if (stateCode && districtCode) {
    const cell = sampleCellAggregates[cellKey(slug, stateCode, districtCode)];
    if (cell) return cell;
  }
  return sampleServiceCitizen[slug] ?? emptyCitizen();
}

const b = (label: string, official: number, reported: number): DistributionBucket => ({
  label, official, reported,
});
const TIMELINE = ["0–7", "8–15", "16–30", "31–60", "61–90", "90+"] as const;
const AMOUNT = ["₹0", "₹1–500", "₹501–1k", "₹1k–2k", "₹2k–5k", "₹5k+"] as const;

/** Dual-series distributions for the flagship services (fractions sum to ~1). */
export const sampleDistributions: Record<string, ServiceDistributions> = {
  "driving-licence": {
    slug: "driving-licence",
    timeline_days: [
      b(TIMELINE[0], 0.05, 0.02), b(TIMELINE[1], 0.2, 0.1), b(TIMELINE[2], 0.7, 0.33),
      b(TIMELINE[3], 0.05, 0.38), b(TIMELINE[4], 0.0, 0.12), b(TIMELINE[5], 0.0, 0.05),
    ],
    additional_amount_inr: [
      b(AMOUNT[0], 1.0, 0.28), b(AMOUNT[1], 0.0, 0.1), b(AMOUNT[2], 0.0, 0.16),
      b(AMOUNT[3], 0.0, 0.24), b(AMOUNT[4], 0.0, 0.17), b(AMOUNT[5], 0.0, 0.05),
    ],
  },
  "land-registration": {
    slug: "land-registration",
    timeline_days: [
      b(TIMELINE[0], 0.03, 0.01), b(TIMELINE[1], 0.15, 0.06), b(TIMELINE[2], 0.72, 0.3),
      b(TIMELINE[3], 0.1, 0.4), b(TIMELINE[4], 0.0, 0.16), b(TIMELINE[5], 0.0, 0.07),
    ],
    additional_amount_inr: [
      b(AMOUNT[0], 1.0, 0.14), b(AMOUNT[1], 0.0, 0.05), b(AMOUNT[2], 0.0, 0.09),
      b(AMOUNT[3], 0.0, 0.16), b(AMOUNT[4], 0.0, 0.29), b(AMOUNT[5], 0.0, 0.27),
    ],
  },
  "property-mutation": {
    slug: "property-mutation",
    timeline_days: [
      b(TIMELINE[0], 0.0, 0.0), b(TIMELINE[1], 0.05, 0.02), b(TIMELINE[2], 0.25, 0.12),
      b(TIMELINE[3], 0.62, 0.34), b(TIMELINE[4], 0.08, 0.32), b(TIMELINE[5], 0.0, 0.2),
    ],
    additional_amount_inr: [
      b(AMOUNT[0], 1.0, 0.2), b(AMOUNT[1], 0.0, 0.08), b(AMOUNT[2], 0.0, 0.14),
      b(AMOUNT[3], 0.0, 0.22), b(AMOUNT[4], 0.0, 0.24), b(AMOUNT[5], 0.0, 0.12),
    ],
  },
  "passport": {
    slug: "passport",
    timeline_days: [
      b(TIMELINE[0], 0.1, 0.16), b(TIMELINE[1], 0.3, 0.4), b(TIMELINE[2], 0.58, 0.34),
      b(TIMELINE[3], 0.02, 0.08), b(TIMELINE[4], 0.0, 0.02), b(TIMELINE[5], 0.0, 0.0),
    ],
    additional_amount_inr: [
      b(AMOUNT[0], 1.0, 0.72), b(AMOUNT[1], 0.0, 0.12), b(AMOUNT[2], 0.0, 0.08),
      b(AMOUNT[3], 0.0, 0.05), b(AMOUNT[4], 0.0, 0.03), b(AMOUNT[5], 0.0, 0.0),
    ],
  },
};

/** Top friction points per service (share = fraction of reports mentioning it). */
export const sampleFrictionByService: Record<string, FrictionPoint[]> = {
  "driving-licence": [
    { code: "additional_payment_requested", share: 0.58 }, { code: "multiple_visits", share: 0.44 },
    { code: "unclear_process", share: 0.27 }, { code: "document_requests_repeated", share: 0.19 },
  ],
  "land-registration": [
    { code: "additional_payment_requested", share: 0.71 }, { code: "document_requests_repeated", share: 0.39 },
    { code: "multiple_visits", share: 0.33 }, { code: "office_staff_unhelpful", share: 0.21 },
  ],
  "property-mutation": [
    { code: "additional_payment_requested", share: 0.63 }, { code: "multiple_visits", share: 0.49 },
    { code: "unclear_process", share: 0.35 }, { code: "office_staff_unhelpful", share: 0.22 },
  ],
  "police-verification": [
    { code: "additional_payment_requested", share: 0.46 }, { code: "multiple_visits", share: 0.38 },
    { code: "office_staff_unhelpful", share: 0.2 },
  ],
  "passport": [
    { code: "multiple_visits", share: 0.24 }, { code: "unclear_process", share: 0.18 },
    { code: "document_requests_repeated", share: 0.11 },
  ],
};

/**
 * Platform totals for the home stat strip. `services_tracked` matches the real
 * catalogue (12); the other three are illustrative synthetic counts.
 */
export const samplePlatformTotals: PlatformTotals = {
  services_tracked: 12,
  citizen_reports: 2293,
  states_covered: 12,
  reports_corroborated: 1261,
};
