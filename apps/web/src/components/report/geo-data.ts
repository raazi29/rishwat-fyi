/**
 * Server-side loader for everything the report wizard's step 1 needs: the
 * department list, the service catalogue, and the full state → district → city
 * tree. Data access stays on the server (build contract) — the wizard receives
 * a plain, fully-resolved {@link WizardGeo} object and filters it locally, so
 * there is no client-side fetch for the cascading selects.
 *
 * Every source goes through `@/lib/api`, so when the API is absent each call
 * falls back to the bundled sample geography (real Indian states/districts) and
 * the overall `source` becomes `"sample"` — the page then shows a
 * `SampleDataStrip`. The service submission id is derived from the slug via the
 * catalogue's stable id helper (the public read endpoints do not expose a
 * service uuid), so the same id is produced online and offline.
 */

import "server-only";

import { listCities, listDepartments, listDistricts, listServices, listStates } from "@/lib/api";
import type { DataSource } from "@/lib/api";
import { sampleServiceDepartmentSlug, sampleServiceId } from "@/lib/fixtures";

import type {
  CityOption,
  DepartmentOption,
  DistrictOption,
  ServiceOption,
  StateOption,
  WizardGeo,
} from "./wizard-types";

export interface WizardGeoResult {
  geo: WizardGeo;
  source: DataSource;
  /** The first fallback reason, surfaced by the SampleDataStrip. */
  reason?: string;
}

/**
 * Preload the wizard's catalogue and geography. Fires the catalogue calls in
 * parallel, then resolves districts per state and cities per district, again in
 * parallel. If any part fell back to the sample dataset the whole result is
 * tagged `"sample"` so nothing is presented as live.
 */
export async function loadWizardGeo(): Promise<WizardGeoResult> {
  const [statesR, departmentsR, servicesR] = await Promise.all([
    listStates(),
    listDepartments(),
    listServices({ per_page: 100 }),
  ]);

  let sampled = statesR.source === "sample" || departmentsR.source === "sample" || servicesR.source === "sample";
  let reason: string | undefined =
    statesR.reason?.message ?? departmentsR.reason?.message ?? servicesR.reason?.message;

  const states: StateOption[] = statesR.data.map((state) => ({
    id: state.id,
    code: state.code,
    name: state.name,
  }));

  const districtsByState: Record<string, DistrictOption[]> = {};
  const districtResults = await Promise.all(
    states.map(async (state) => {
      const result = await listDistricts(state.code);
      return { code: state.code, result };
    }),
  );
  const allDistricts: { stateCode: string; district: DistrictOption }[] = [];
  for (const { code, result } of districtResults) {
    if (result.source === "sample") {
      sampled = true;
      reason ??= result.reason?.message;
    }
    const districts: DistrictOption[] = result.data.map((district) => ({
      id: district.id,
      code: district.code,
      name: district.name,
    }));
    districtsByState[code] = districts;
    for (const district of districts) allDistricts.push({ stateCode: code, district });
  }

  const citiesByDistrict: Record<string, CityOption[]> = {};
  const cityResults = await Promise.all(
    allDistricts.map(async ({ district }) => {
      const result = await listCities(district.id);
      return { districtId: district.id, result };
    }),
  );
  for (const { districtId, result } of cityResults) {
    if (result.source === "sample") {
      sampled = true;
      reason ??= result.reason?.message;
    }
    citiesByDistrict[districtId] = result.data.map((city) => ({ id: city.id, name: city.name }));
  }

  const departments: DepartmentOption[] = departmentsR.data.map((department) => ({
    slug: department.slug,
    name: department.name,
  }));

  const services: ServiceOption[] = servicesR.data.items.map((service) => ({
    id: sampleServiceId(service.slug),
    slug: service.slug,
    name: service.name,
    department: service.department,
    departmentSlug: sampleServiceDepartmentSlug[service.slug] ?? "",
  }));

  const geo: WizardGeo = { departments, states, districtsByState, citiesByDistrict, services };
  return sampled ? { geo, source: "sample", reason } : { geo, source: "api" };
}
