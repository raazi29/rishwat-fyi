/**
 * Server-side loader for everything the report wizard's step 1 needs: the
 * department list, service catalogue, and full state → district → city tree.
 *
 * The geography is deliberately fetched from one bulk endpoint. The former
 * implementation called one endpoint for every state and then every district:
 * with the production seed that was roughly 805 HTTP requests for one page
 * render, immediately exceeding the API's 60/minute read limit and causing the
 * report page (then other pages sharing the same proxy bucket) to render the
 * global error boundary.
 *
 * This loader now performs exactly three independent HTTP requests regardless
 * of catalogue size: geography tree, departments, and services.
 */

import "server-only";

import { listDepartments, listLocationTree, listServices } from "@/lib/api";
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
 * Preload the wizard's catalogue and geography in three bounded requests. If
 * any response falls back to bundled data, the entire result is marked sample
 * so no sample value can be mistaken for live production data.
 */
export async function loadWizardGeo(): Promise<WizardGeoResult> {
  const [treeR, departmentsR, servicesR] = await Promise.all([
    listLocationTree(),
    listDepartments(),
    listServices({ per_page: 100 }),
  ]);

  const sampled =
    treeR.source === "sample" ||
    departmentsR.source === "sample" ||
    servicesR.source === "sample";
  const reason =
    treeR.reason?.message ?? departmentsR.reason?.message ?? servicesR.reason?.message;

  const states: StateOption[] = treeR.data.map((state) => ({
    id: state.id,
    code: state.code,
    name: state.name,
  }));

  const districtsByState: Record<string, DistrictOption[]> = {};
  const citiesByDistrict: Record<string, CityOption[]> = {};
  for (const state of treeR.data) {
    districtsByState[state.code] = state.districts.map((district) => ({
      id: district.id,
      code: district.code,
      name: district.name,
    }));
    for (const district of state.districts) {
      citiesByDistrict[district.id] = district.cities.map((city) => ({
        id: city.id,
        name: city.name,
      }));
    }
  }

  const departments: DepartmentOption[] = departmentsR.data.map((department) => ({
    slug: department.slug,
    name: department.name,
  }));

  const services: ServiceOption[] = servicesR.data.items.map((service) => ({
    // Kept only as a stable UI key. Report submission uses service_slug because
    // a fixture-derived id is not a database foreign key.
    id: sampleServiceId(service.slug),
    slug: service.slug,
    name: service.name,
    department: service.department,
    departmentSlug: sampleServiceDepartmentSlug[service.slug] ?? "",
  }));

  const geo: WizardGeo = { departments, states, districtsByState, citiesByDistrict, services };
  return sampled ? { geo, source: "sample", reason } : { geo, source: "api" };
}
