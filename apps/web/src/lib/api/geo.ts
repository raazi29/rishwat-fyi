/**
 * Geography + departments resources.
 *
 * Paths follow the live API mount points in apps/api/src/app.ts, which nests
 * the location catalogue under `/locations` (`/locations/states`,
 * `/locations/states/:code/districts`, `/locations/districts/:id/cities`,
 * `/locations/departments`). docs/api.md still lists these at the root; the
 * running code and `/doc/openapi.json` are authoritative.
 *
 * Revalidate tiers: catalogue/geo = 300s; aggregates = 120s.
 * `getStateGaps` / `getStateDetail` have no dedicated endpoint, so they are
 * derived from the public dataset export (`GET /datasets/reports.json`) — the
 * same figures any mirror would compute — and fall back to the bundled sample
 * only when the API cannot be reached.
 */

import {
  apiFetchList,
  withSample,
  withSampleUnlessMissing,
  type ApiResult,
  type Sourced,
} from "./client";
import { deriveStateGaps, deriveStateServices, type DatasetRow } from "./dataset-aggregate";
import type {
  CityRef,
  DepartmentRef,
  DistrictRef,
  LocationTreeState,
  StateGap,
  StateRef,
} from "./types";
import type { StateDetailView, StateServiceGap } from "./view-models";
import {
  findCities,
  findDepartment,
  findDistricts,
  findState,
  sampleDepartments,
  sampleLocationTree,
  sampleStates,
} from "@/lib/fixtures/geo";
import { sampleServiceCitizen } from "@/lib/fixtures/aggregates";
import { sampleServiceList } from "@/lib/fixtures/services";
import { sampleStateGaps } from "@/lib/fixtures/state-gaps";

const CATALOGUE = 300;
const AGGREGATE = 120;

export function listStates(): Promise<Sourced<StateRef[]>> {
  return withSample(
    () => apiFetchList<StateRef>("/locations/states", "items", { revalidate: CATALOGUE }),
    () => sampleStates,
  );
}

/**
 * One-request geography catalogue for the report wizard. The corresponding API
 * endpoint performs three constant-count database queries; using it avoids the
 * previous 36-state + 766-district HTTP fan-out on every `/report` render.
 */
export function listLocationTree(): Promise<Sourced<LocationTreeState[]>> {
  return withSample(
    () => apiFetchList<LocationTreeState>("/locations/tree", "items", { revalidate: CATALOGUE }),
    () => sampleLocationTree,
  );
}

export function listDistricts(stateCode: string): Promise<Sourced<DistrictRef[]>> {
  return withSample(
    () =>
      apiFetchList<DistrictRef>(
        `/locations/states/${encodeURIComponent(stateCode)}/districts`,
        "items",
        { revalidate: CATALOGUE },
      ),
    () => findDistricts(stateCode),
  );
}

export function listCities(districtId: string): Promise<Sourced<CityRef[]>> {
  return withSample(
    () =>
      apiFetchList<CityRef>(
        `/locations/districts/${encodeURIComponent(districtId)}/cities`,
        "items",
        { revalidate: CATALOGUE },
      ),
    () => findCities(districtId),
  );
}

export function listDepartments(): Promise<Sourced<DepartmentRef[]>> {
  return withSample(
    () => apiFetchList<DepartmentRef>("/locations/departments", "items", { revalidate: CATALOGUE }),
    () => sampleDepartments,
  );
}

/** No per-slug endpoint: narrow the department list. `null` on a real 404. */
export function getDepartment(slug: string): Promise<Sourced<DepartmentRef> | null> {
  return withSampleUnlessMissing(
    async (): Promise<ApiResult<DepartmentRef>> => {
      const result = await apiFetchList<DepartmentRef>("/locations/departments", "items", {
        revalidate: CATALOGUE,
      });
      if (!result.ok) return result;
      const found = result.data.find((department) => department.slug === slug);
      return found
        ? { ok: true, data: found }
        : { ok: false, error: { code: "not_found", message: `Unknown department "${slug}".` } };
    },
    () => findDepartment(slug),
  );
}

/**
 * Per-state gaps, computed from the published dataset export. Falls back to the
 * bundled sample when either the export or the state catalogue is unreachable.
 */
export async function getStateGaps(): Promise<Sourced<StateGap[]>> {
  const [dataset, states] = await Promise.all([
    apiFetchList<DatasetRow>("/datasets/reports.json", "rows", { revalidate: AGGREGATE }),
    apiFetchList<StateRef>("/locations/states", "items", { revalidate: CATALOGUE }),
  ]);

  if (dataset.ok && states.ok) {
    return { data: deriveStateGaps(dataset.data, states.data), source: "api" };
  }

  const failure = dataset.ok ? states : dataset;
  return {
    data: sampleStateGaps,
    source: "sample",
    reason: failure.ok
      ? { code: "invalid_response", message: "The dataset export could not be read." }
      : failure.error,
  };
}

function verificationFor(rate: number | null): StateServiceGap["verification"] {
  if (rate === null) return null;
  return rate >= 0.66 ? "corroborated" : "validated";
}

const LADDER = new Set<string>([
  "submitted",
  "validated",
  "corroborated",
  "evidence_backed",
  "officially_acknowledged",
]);

function asVerification(status: string | null): StateServiceGap["verification"] {
  return status !== null && LADDER.has(status)
    ? (status as NonNullable<StateServiceGap["verification"]>)
    : null;
}

/** Sample assembly, used only when the API is unreachable. */
function sampleTopStateServices(): StateServiceGap[] {
  return sampleServiceList
    .map((service): StateServiceGap => {
      const citizen = sampleServiceCitizen[service.slug];
      return {
        slug: service.slug,
        name: service.name,
        department: service.department,
        report_count: citizen?.report_count ?? 0,
        additional_amount_median: citizen?.extra_payment_median ?? null,
        verification: verificationFor(citizen?.corroboration_rate ?? null),
      };
    })
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 5);
}

function emptyGap(code: string, name: string): StateGap {
  return {
    code,
    name,
    additional_amount_median: null,
    report_count: 0,
    services_covered: 0,
    districts_covered: 0,
  };
}

/**
 * State page view. Composed from the live catalogue (`/locations/states`,
 * `/locations/states/:code/districts`) and the public dataset export, since no
 * single endpoint returns it. `null` when the state code is unknown to a live
 * catalogue — that is a real 404.
 */
export async function getStateDetail(code: string): Promise<Sourced<StateDetailView> | null> {
  const [states, districts, dataset] = await Promise.all([
    apiFetchList<StateRef>("/locations/states", "items", { revalidate: CATALOGUE }),
    apiFetchList<DistrictRef>(
      `/locations/states/${encodeURIComponent(code)}/districts`,
      "items",
      { revalidate: CATALOGUE },
    ),
    apiFetchList<DatasetRow>("/datasets/reports.json", "rows", { revalidate: AGGREGATE }),
  ]);

  if (states.ok) {
    const state = states.data.find((entry) => entry.code === code);
    if (state === undefined) return null;

    const rows = dataset.ok ? dataset.data : [];
    const gaps = dataset.ok ? deriveStateGaps(rows, states.data) : [];
    const view: StateDetailView = {
      state,
      gap: gaps.find((entry) => entry.code === code) ?? emptyGap(code, state.name),
      districts: districts.ok ? districts.data : [],
      top_services: deriveStateServices(rows, state.name).map(
        (service): StateServiceGap => ({
          slug: service.slug,
          name: service.name,
          department: service.department,
          report_count: service.report_count,
          additional_amount_median: service.additional_amount_median,
          verification: asVerification(service.strongest_status),
        }),
      ),
    };

    return dataset.ok
      ? { data: view, source: "api" }
      : { data: view, source: "sample", reason: dataset.error };
  }

  // The catalogue itself is unreachable: fall back to the bundled sample.
  const sampleState = findState(code);
  if (!sampleState) return null;
  return {
    data: {
      state: sampleState,
      gap: sampleStateGaps.find((entry) => entry.code === code) ?? emptyGap(code, sampleState.name),
      districts: findDistricts(code),
      top_services: sampleTopStateServices(),
    },
    source: "sample",
    reason: states.error,
  };
}
