import type {
  CitizenAggregate,
  FrictionPoint,
  PublicReport,
  ServiceDistributions,
  Sourced,
  VerificationLevel,
} from "@/lib/api";
import { VERIFICATION_LADDER } from "@/lib/api";
import {
  samplePublicReports,
  sampleDistributions,
  sampleFrictionByService,
} from "@/lib/fixtures";

/**
 * Service-detail helpers.
 *
 * `deriveVerification` maps the citizen aggregate onto the public ladder from
 * only what the API actually returns (report volume, independence and
 * corroboration rate) — it never claims a rung the data cannot support, so it
 * caps at `corroborated`.
 *
 * `getServiceInsights` / `getServiceReports` cover data the public API does not
 * yet serve: there is no endpoint for reported distributions, friction shares,
 * or a per-service list of public reports (only `GET /reports/:id`). They
 * therefore resolve to the bundled sample, tagged `source: "sample"`, exactly
 * like the endpoint-less geo/dataset resources — no endpoint is invented, and
 * the caller renders a sample-data strip. Promote them into `@/lib/api` if the
 * API grows the endpoints.
 */

export interface DerivedVerification {
  level: VerificationLevel | null;
  /** Index of the highest reached rung (0 = submitted). */
  reachedIndex: number;
}

export function deriveVerification(citizen: CitizenAggregate): DerivedVerification {
  if (!citizen.published) return { level: null, reachedIndex: 0 };
  const level: VerificationLevel =
    (citizen.corroboration_rate ?? 0) >= 0.66 ? "corroborated" : "validated";
  return { level, reachedIndex: VERIFICATION_LADDER.indexOf(level) };
}

/** True when the cell is corroborated or higher (drives the title shield). */
export function isCorroborated(citizen: CitizenAggregate): boolean {
  const { level } = deriveVerification(citizen);
  if (!level) return false;
  return VERIFICATION_LADDER.indexOf(level) >= VERIFICATION_LADDER.indexOf("corroborated");
}

export interface ServiceInsights {
  distributions: ServiceDistributions | null;
  friction: FrictionPoint[];
}

const SAMPLE_REASON = {
  code: "not_found" as const,
  message: "The API does not serve reported distributions or friction yet.",
};

/** Reported distributions + friction for a service. Always sample. */
export function getServiceInsights(slug: string): Sourced<ServiceInsights> {
  return {
    data: {
      distributions: sampleDistributions[slug] ?? null,
      friction: sampleFrictionByService[slug] ?? [],
    },
    source: "sample",
    reason: SAMPLE_REASON,
  };
}

/** Recent public reports for a service. Always sample (no list endpoint). */
export function getServiceReports(slug: string): Sourced<PublicReport[]> {
  return {
    data: samplePublicReports.filter((report) => report.service.slug === slug),
    source: "sample",
    reason: {
      code: "not_found",
      message: "The API has no per-service report list endpoint yet.",
    },
  };
}
