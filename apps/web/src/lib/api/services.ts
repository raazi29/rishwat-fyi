/**
 * Services resources: search, list, detail, and the comparison-table rows.
 *
 * Revalidate tiers: `listServices` (pure catalogue) = 300s; `searchServices`
 * (carries report counts) and `getServiceDetail` (citizen aggregate) = 120s.
 * `getComparisonRows` composes `/search` with per-service detail; it is tagged
 * `source: "sample"` if ANY part fell back, so sample figures are never
 * presented as live.
 */

import { apiFetch, withSample, withSampleUnlessMissing, type ApiResult, type Sourced } from "./client";
import type {
  CitizenAggregate,
  ComparisonRow,
  GovernmentSource,
  Inr,
  Paginated,
  SearchResultItem,
  ServiceDetail,
  ServiceDetailResponse,
  ServiceListItem,
  VerificationLevel,
} from "./types";
import type { ServiceSearchParams } from "./view-models";
import { getSampleCitizen } from "@/lib/fixtures/aggregates";
import { findDistrictByName, sampleStates } from "@/lib/fixtures/geo";
import {
  buildServiceDetailResponse,
  findServiceDetail,
  sampleServiceDepartmentSlug,
  sampleServiceList,
  sampleServiceReportCounts,
} from "@/lib/fixtures/services";

const CATALOGUE = 300;
const AGGREGATE = 120;

function toQuery(params: ServiceSearchParams): Record<string, string | number | undefined> {
  return {
    q: params.q,
    department: params.department,
    state: params.state,
    district: params.district,
    page: params.page,
    per_page: params.per_page,
  };
}

function paginate<T>(items: T[], params: ServiceSearchParams): Paginated<T> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.per_page && params.per_page > 0 ? Math.min(params.per_page, 100) : 20;
  const start = (page - 1) * perPage;
  return { total: items.length, items: items.slice(start, start + perPage) };
}

function filterServices(params: ServiceSearchParams): ServiceListItem[] {
  const query = params.q?.trim().toLowerCase();
  return sampleServiceList.filter((service) => {
    if (params.department && sampleServiceDepartmentSlug[service.slug] !== params.department) {
      return false;
    }
    if (query) {
      const haystack = `${service.name} ${service.description} ${service.department}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function resolveCell(
  stateName: string | null,
  districtName: string | null,
): { stateCode: string; districtCode: string } | null {
  if (!stateName || !districtName) return null;
  const state = sampleStates.find((entry) => entry.name === stateName);
  if (!state) return null;
  const district = findDistrictByName(state.code, districtName);
  return district ? { stateCode: state.code, districtCode: district.code } : null;
}

function sampleSearch(params: ServiceSearchParams): Paginated<SearchResultItem> {
  const cell = resolveCell(params.state ?? null, params.district ?? null);
  const items: SearchResultItem[] = filterServices(params).map((service) => ({
    slug: service.slug,
    name: service.name,
    department: service.department,
    state: params.state ?? null,
    district: params.district ?? null,
    report_count: cell
      ? getSampleCitizen(service.slug, cell.stateCode, cell.districtCode).report_count
      : sampleServiceReportCounts[service.slug] ?? 0,
  }));
  return paginate(items, params);
}

export function searchServices(
  params: ServiceSearchParams = {},
): Promise<Sourced<Paginated<SearchResultItem>>> {
  return withSample(
    () =>
      apiFetch<Paginated<SearchResultItem>>("/search", {
        query: toQuery(params),
        revalidate: AGGREGATE,
      }),
    () => sampleSearch(params),
  );
}

export function listServices(
  params: ServiceSearchParams = {},
): Promise<Sourced<Paginated<ServiceListItem>>> {
  return withSample(
    () =>
      apiFetch<Paginated<ServiceListItem>>("/services", {
        query: toQuery(params),
        revalidate: CATALOGUE,
      }),
    () => paginate(filterServices(params), params),
  );
}

/** Service detail. `null` on a real 404. Citizen block is the nationwide cell. */
export function getServiceDetail(slug: string): Promise<Sourced<ServiceDetailResponse> | null> {
  return withSampleUnlessMissing(
    async (): Promise<ApiResult<ServiceDetailResponse>> => {
      const raw = await apiFetch<unknown>(`/services/${encodeURIComponent(slug)}`, {
        revalidate: AGGREGATE,
      });
      if (!raw.ok) return raw as ApiResult<ServiceDetailResponse>;
      const normalized = normalizeServiceDetailResponse(raw.data);
      if (!normalized) {
        return {
          ok: false,
          error: {
            code: "invalid_response",
            message: `Service "${slug}" returned an unexpected shape.`,
          },
        };
      }
      return { ok: true, data: normalized };
    },
    () => buildServiceDetailResponse(slug),
  );
}

function normalizeGovernmentSource(
  raw: unknown,
): GovernmentSource | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const url = typeof r.url === "string" ? r.url : "";
  const title = typeof r.title === "string" ? r.title : "";
  const last_verified_at =
    typeof r.last_verified_at === "string" || r.last_verified_at === null
      ? (r.last_verified_at as string | null)
      : null;
  if (!url && !title) return undefined;
  return { url, title, last_verified_at };
}

/**
 * Adapt the live API's flat `GET /services/:slug` shape to the web's
 * `{ service, sources, citizen, notice }` view model.
 *
 * Live shape (per docs/api.md):
 *   { id, slug, name, description, department: {slug,name}, official: {fee_inr,...}, sources, citizen, notice }
 * Web shape (fixtures + pages):
 *   { service: { slug, name, department:string, ...official_* }, sources, citizen, notice }
 *
 * Also passes through already-normalized shapes (fixtures / future API) so
 * the helper is safe regardless of which backend is deployed.
 */
function normalizeServiceDetailResponse(raw: unknown): ServiceDetailResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Already the web's wrapped shape? (fixture or already-migrated API)
  if (
    "service" in r &&
    r.service !== null &&
    typeof r.service === "object" &&
    "slug" in (r.service as Record<string, unknown>)
  ) {
    const maybe = raw as ServiceDetailResponse;
    // Minimal validation — must have slug+name
    if (typeof maybe.service.slug === "string" && typeof maybe.service.name === "string") {
      return maybe;
    }
  }

  // Live flat shape: must have at least `official` + `citizen` + `slug`
  if (!("official" in r) || !("citizen" in r) || !("slug" in r)) return null;

  const official = (r.official ?? {}) as Record<string, unknown>;
  const dept = r.department as unknown;
  const citizen = r.citizen as CitizenAggregate;
  const notice = typeof r.notice === "string" ? r.notice : "";

  const slug = typeof r.slug === "string" ? r.slug : "";
  const name = typeof r.name === "string" ? r.name : slug;
  if (!slug || !name) return null;

  const departmentName = (() => {
    if (typeof dept === "string") return dept;
    if (dept && typeof dept === "object" && "name" in (dept as Record<string, unknown>)) {
      const n = (dept as Record<string, unknown>).name;
      if (typeof n === "string" && n.length > 0) return n;
    }
    return "Unknown department";
  })();

  const description = typeof r.description === "string" ? r.description : "";

  const service: ServiceDetail = {
    slug,
    name,
    department: departmentName,
    description,
    official_fee_inr: (official.fee_inr as Inr | null) ?? null,
    official_timeline_days: (official.timeline_days as number | null) ?? null,
    official_visits: (official.visits as number | null) ?? null,
    official_documents: Array.isArray(official.documents)
      ? (official.documents as ServiceDetail["official_documents"])
      : [],
    process_steps: Array.isArray(official.process_steps)
      ? (official.process_steps as ServiceDetail["process_steps"])
      : [],
  };

  const sourcesRaw = (r.sources ?? {}) as Record<string, unknown>;
  const sources = {
    fee: normalizeGovernmentSource(sourcesRaw.fee),
    timeline: normalizeGovernmentSource(sourcesRaw.timeline),
  } as ServiceDetailResponse["sources"];

  // Preserve any extra source keys defensively
  for (const [key, value] of Object.entries(sourcesRaw)) {
    if (key === "fee" || key === "timeline") continue;
    const gov = normalizeGovernmentSource(value);
    if (gov) (sources as Record<string, GovernmentSource | undefined>)[key] = gov;
  }

  if (!citizen || typeof citizen !== "object") return null;

  return { service, sources, citizen: citizen as CitizenAggregate, notice };
}

function deriveVerification(citizen: CitizenAggregate): VerificationLevel | null {
  if (!citizen.published) return null;
  return (citizen.corroboration_rate ?? 0) >= 0.66 ? "corroborated" : "validated";
}

function toComparisonRow(
  item: SearchResultItem,
  service: ServiceDetail,
  citizen: CitizenAggregate,
): ComparisonRow {
  const reportedTimeline =
    citizen.delay_median === null
      ? null
      : (service.official_timeline_days ?? 0) + citizen.delay_median;
  return {
    slug: service.slug,
    name: service.name,
    department: service.department,
    location: { district: item.district, state: item.state },
    official: {
      fee_inr: service.official_fee_inr,
      timeline_days: service.official_timeline_days,
      documents: service.official_documents.length,
    },
    reported: {
      additional_amount_inr: citizen.extra_payment_median,
      timeline_days: reportedTimeline,
      visits: citizen.visits_avg,
    },
    report_count: citizen.report_count,
    verification: deriveVerification(citizen),
    published: citizen.published,
  };
}

function buildSampleComparisonRows(
  items: SearchResultItem[],
  params: ServiceSearchParams,
): ComparisonRow[] {
  const cell = resolveCell(params.state ?? null, params.district ?? null);
  const rows: ComparisonRow[] = [];
  for (const item of items) {
    const service = findServiceDetail(item.slug);
    if (!service) continue;
    rows.push(toComparisonRow(item, service, getSampleCitizen(item.slug, cell?.stateCode, cell?.districtCode)));
  }
  return rows;
}

/** Assemble comparison rows for the search table. */
export async function getComparisonRows(
  params: ServiceSearchParams = {},
): Promise<Sourced<ComparisonRow[]>> {
  const search = await searchServices(params);
  if (search.source === "sample") {
    return { data: buildSampleComparisonRows(search.data.items, params), source: "sample", reason: search.reason };
  }
  const rows: ComparisonRow[] = [];
  let sampled = false;
  for (const item of search.data.items) {
    const detail = await getServiceDetail(item.slug);
    if (!detail) continue;
    if (detail.source === "sample") sampled = true;
    rows.push(toComparisonRow(item, detail.data.service, detail.data.citizen));
  }
  return sampled
    ? {
        data: rows,
        source: "sample",
        reason: { code: "invalid_response", message: "Some service details fell back to sample data." },
      }
    : { data: rows, source: "api" };
}
