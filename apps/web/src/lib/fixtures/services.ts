/**
 * SAMPLE DATA — service catalogue glue.
 *
 * Derives the service list, government-source records, per-service report
 * counts and the assembled `ServiceDetailResponse` from the verbatim official
 * catalogue (`service-details.ts`) and the illustrative citizen aggregates
 * (`aggregates.ts`).
 *
 * Government source URLs and titles are REAL, copied verbatim from
 * `packages/database/src/seed/services/sources.ts`. `last_verified_at` is an
 * illustrative sample timestamp — the seed carries no verification date, and
 * the live API computes it.
 */

import type {
  ServiceDetail,
  ServiceDetailResponse,
  ServiceListItem,
  ServiceSources,
} from "@/lib/api/types";
import { CITIZEN_REPORT_NOTICE, getSampleCitizen, sampleServiceCitizen } from "./aggregates";
import { sampleId } from "./ids";
import { sampleServiceDetails } from "./service-details";

const SOURCE_URL = {
  parivahan: "https://parivahan.gov.in/parivahan/",
  igrsup: "https://igrsup.gov.in/",
  dilrmp: "https://dilrmp.gov.in/",
  nsws: "https://www.nsws.gov.in/",
  crs: "https://crsorgi.gov.in/",
  nfsa: "https://nfsa.gov.in/",
  gst: "https://www.gst.gov.in/",
  passport: "https://www.passportindia.gov.in/",
} as const;

type SourceKey = keyof typeof SOURCE_URL;

const SOURCE_TITLE: Record<SourceKey, string> = {
  parivahan: "Parivahan Sewa — Ministry of Road Transport & Highways",
  igrsup: "Stamps & Registration Department (IGRS)",
  dilrmp: "Digital India Land Records Modernization Programme (DILRMP)",
  nsws: "National Single Window System — Business Approvals",
  crs: "Civil Registration System — Births & Deaths (ORGI)",
  nfsa: "National Food Security Act / Public Distribution System Portal",
  gst: "Goods and Services Tax Portal (GSTN)",
  passport: "Passport Seva — Ministry of External Affairs",
};

/** Illustrative sample "last verified" dates (not from the seed). */
const SOURCE_VERIFIED_AT: Record<SourceKey, string> = {
  parivahan: "2026-07-02T00:00:00.000Z",
  igrsup: "2026-06-18T00:00:00.000Z",
  dilrmp: "2026-06-25T00:00:00.000Z",
  nsws: "2026-07-09T00:00:00.000Z",
  crs: "2026-05-30T00:00:00.000Z",
  nfsa: "2026-06-11T00:00:00.000Z",
  gst: "2026-07-16T00:00:00.000Z",
  passport: "2026-07-21T00:00:00.000Z",
};

/** Service → government source (fee and timeline share one source per seed). */
const SERVICE_SOURCE_KEY: Record<string, SourceKey> = {
  "driving-licence": "parivahan",
  "vehicle-registration": "parivahan",
  "land-registration": "igrsup",
  "property-mutation": "dilrmp",
  "building-permit": "nsws",
  "trade-licence": "nsws",
  "birth-certificate": "crs",
  "death-certificate": "crs",
  "police-verification": "passport",
  "ration-card": "nfsa",
  "gst-registration": "gst",
  "passport": "passport",
};

/** Service → department slug (for the department filter). Verbatim from seed. */
export const sampleServiceDepartmentSlug: Record<string, string> = {
  "driving-licence": "transport",
  "vehicle-registration": "transport",
  "land-registration": "registration-stamps",
  "property-mutation": "revenue",
  "building-permit": "municipal",
  "trade-licence": "municipal",
  "birth-certificate": "municipal",
  "death-certificate": "municipal",
  "police-verification": "police",
  "ration-card": "food-civil-supplies",
  "gst-registration": "commercial-taxes",
  "passport": "passport-seva",
};

export function sampleServiceId(slug: string): string {
  return sampleId(`service:${slug}`);
}

export const sampleServiceList: ServiceListItem[] = sampleServiceDetails.map((service) => ({
  slug: service.slug,
  name: service.name,
  department: service.department,
  description: service.description,
}));

function buildSources(slug: string): ServiceSources {
  const key = SERVICE_SOURCE_KEY[slug];
  if (!key) return {};
  const source = {
    url: SOURCE_URL[key],
    title: SOURCE_TITLE[key],
    last_verified_at: SOURCE_VERIFIED_AT[key],
  };
  return { fee: source, timeline: source };
}

export const sampleServiceSources: Record<string, ServiceSources> = Object.fromEntries(
  sampleServiceDetails.map((service) => [service.slug, buildSources(service.slug)]),
);

/** Per-service nationwide report counts (drives search result counts). */
export const sampleServiceReportCounts: Record<string, number> = Object.fromEntries(
  sampleServiceDetails.map((service) => [
    service.slug,
    sampleServiceCitizen[service.slug]?.report_count ?? 0,
  ]),
);

export function findServiceDetail(slug: string): ServiceDetail | null {
  return sampleServiceDetails.find((service) => service.slug === slug) ?? null;
}

/** Assemble the `/services/:slug` response for a service, optionally by cell. */
export function buildServiceDetailResponse(
  slug: string,
  stateCode?: string,
  districtCode?: string,
): ServiceDetailResponse | null {
  const service = findServiceDetail(slug);
  if (!service) return null;
  return {
    service,
    sources: sampleServiceSources[slug] ?? {},
    citizen: getSampleCitizen(slug, stateCode, districtCode),
    notice: CITIZEN_REPORT_NOTICE,
  };
}
