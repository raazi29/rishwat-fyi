import {
  listCities,
  listDistricts,
  listStates,
  type CityRef,
  type DistrictRef,
  type StateRef,
} from "@/lib/api";
import type { ReadSearch } from "./search-params";

/**
 * Resolves the location the user is filtering by. Explicit `state`/`district`
 * params (set by the rail's selects) win; otherwise the bar's free-text
 * `location` is parsed and validated against real geography. Also returns the
 * dependent option lists (districts of the resolved state, cities of the
 * resolved district) so the rail's selects render server-side without JS.
 * Location is expressed by NAME to match the `/search` API contract.
 */
export interface ResolvedLocation {
  states: StateRef[];
  districts: DistrictRef[];
  cities: CityRef[];
  state: string;
  district: string;
  city: string;
}

function parts(location: string): string[] {
  return location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const eq = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

export async function resolveLocation(read: ReadSearch): Promise<ResolvedLocation> {
  const states = (await listStates()).data;
  const locationParts = parts(read.location);

  let stateRef = read.state ? states.find((entry) => eq(entry.name, read.state)) : undefined;
  if (!stateRef && locationParts.length > 0) {
    stateRef = states.find((entry) => locationParts.some((part) => eq(entry.name, part)));
  }

  let districts: DistrictRef[] = [];
  let districtRef: DistrictRef | undefined;
  if (stateRef) {
    districts = (await listDistricts(stateRef.code)).data;
    districtRef = read.district
      ? districts.find((entry) => eq(entry.name, read.district))
      : undefined;
    if (!districtRef && locationParts.length > 0) {
      districtRef = districts.find((entry) => locationParts.some((part) => eq(entry.name, part)));
    }
  }

  let cities: CityRef[] = [];
  let cityName = "";
  if (districtRef) {
    cities = (await listCities(districtRef.id)).data;
    const cityMatch = read.city ? cities.find((entry) => eq(entry.name, read.city)) : undefined;
    cityName = cityMatch?.name ?? "";
  }

  return {
    states,
    districts,
    cities,
    state: stateRef?.name ?? "",
    district: districtRef?.name ?? "",
    city: cityName,
  };
}
