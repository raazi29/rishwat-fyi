/**
 * SAMPLE DATA — geography and departments.
 *
 * The geography here is REAL: state codes/names, district names and their
 * headquarters cities are copied verbatim from
 * `packages/database/src/seed/locations/*.ts`, and the 8 departments from
 * `packages/database/src/seed/services/departments.ts`. This module carries no
 * citizen-reported figures — those live in `aggregates.ts` / `reports.ts` and
 * are illustrative sample data. Only the UUIDs are synthetic (deterministic,
 * see `ids.ts`), because the real database ids are not part of the seed.
 *
 * This is a curated subset (15 states with real districts, Uttar Pradesh /
 * Varanasi included) — enough to render every geographic surface offline
 * without shipping all 36 states × their districts.
 */

import type { CityRef, DepartmentRef, DistrictRef, StateRef } from "@/lib/api/types";
import { sampleId } from "./ids";

interface RawDistrict {
  code: string;
  name: string;
  cities: string[];
}
interface RawState {
  code: string;
  name: string;
  districts: RawDistrict[];
}

/** Mirror of the seed slugify — district `code` is the slug of its name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** District builder mirroring the seed's `d(name, ...cities)`. */
function d(name: string, ...cities: string[]): RawDistrict {
  return { code: slugify(name), name, cities: cities.length ? cities : [name] };
}
function s(code: string, name: string, districts: RawDistrict[]): RawState {
  return { code, name, districts };
}

// Districts and cities are copied verbatim from the seed location files.
const GEO: RawState[] = [
  s("UP", "Uttar Pradesh", [
    d("Varanasi"), d("Lucknow"), d("Agra"), d("Prayagraj", "Prayagraj"),
    d("Gautam Buddha Nagar", "Noida", "Greater Noida"), d("Kanpur Nagar", "Kanpur"),
    d("Ghaziabad"), d("Meerut"), d("Gorakhpur"), d("Bareilly"), d("Aligarh"), d("Mathura"),
  ]),
  s("DL", "Delhi", [
    d("New Delhi", "New Delhi"), d("Central Delhi", "Daryaganj"), d("North Delhi", "Delhi"),
    d("South Delhi", "Saket"), d("East Delhi", "Preet Vihar"), d("West Delhi", "Rajouri Garden"),
  ]),
  s("MH", "Maharashtra", [
    d("Mumbai City", "Mumbai"), d("Mumbai Suburban", "Bandra"), d("Pune"), d("Nagpur"),
    d("Nashik"), d("Thane"), d("Chhatrapati Sambhajinagar", "Aurangabad"),
  ]),
  s("KA", "Karnataka", [
    d("Bengaluru Urban", "Bengaluru"), d("Mysuru"), d("Belagavi", "Belgaum"),
    d("Kalaburagi", "Gulbarga"), d("Dakshina Kannada", "Mangaluru"), d("Dharwad", "Hubballi"),
  ]),
  s("TN", "Tamil Nadu", [
    d("Chennai"), d("Coimbatore"), d("Madurai"), d("Tiruchirappalli", "Trichy"), d("Salem"),
  ]),
  s("WB", "West Bengal", [
    d("Kolkata"), d("Howrah"), d("North 24 Parganas", "Barasat"), d("Darjeeling"),
    d("Malda", "English Bazar"),
  ]),
  s("GJ", "Gujarat", [
    d("Ahmedabad"), d("Surat"), d("Vadodara"), d("Rajkot"), d("Gandhinagar"),
  ]),
  s("RJ", "Rajasthan", [
    d("Jaipur"), d("Jodhpur"), d("Udaipur"), d("Kota"), d("Ajmer"),
  ]),
  s("MP", "Madhya Pradesh", [
    d("Bhopal"), d("Indore"), d("Gwalior"), d("Jabalpur"), d("Ujjain"),
  ]),
  s("BR", "Bihar", [
    d("Patna"), d("Gaya"), d("Muzaffarpur"), d("Bhagalpur"), d("Darbhanga"),
  ]),
  s("TG", "Telangana", [
    d("Hyderabad"), d("Warangal"), d("Karimnagar"), d("Nizamabad"), d("Khammam"),
  ]),
  s("KL", "Kerala", [
    d("Thiruvananthapuram"), d("Ernakulam", "Kochi"), d("Kozhikode", "Calicut"),
    d("Thrissur"), d("Kollam"),
  ]),
  s("PB", "Punjab", [
    d("Ludhiana"), d("Amritsar"), d("Jalandhar"), d("Patiala"), d("Bathinda"),
  ]),
  s("HR", "Haryana", [
    d("Gurugram", "Gurugram", "Gurgaon"), d("Faridabad"), d("Karnal"), d("Panipat"), d("Hisar"),
  ]),
  s("AS", "Assam", [
    d("Kamrup Metropolitan", "Guwahati"), d("Cachar", "Silchar"), d("Dibrugarh"),
    d("Jorhat"), d("Nagaon"),
  ]),
];

/** Stable sample id for a state (by ISO code). */
export function sampleStateId(code: string): string {
  return sampleId(`state:${code}`);
}
/** Stable sample id for a district (by state code + district slug). */
export function sampleDistrictId(stateCode: string, districtCode: string): string {
  return sampleId(`district:${stateCode}:${districtCode}`);
}
function sampleCityId(districtId: string, cityName: string): string {
  return sampleId(`city:${districtId}:${cityName}`);
}

export const sampleStates: StateRef[] = GEO.map((state) => ({
  id: sampleStateId(state.code),
  code: state.code,
  name: state.name,
}));

export const sampleDistrictsByState: Record<string, DistrictRef[]> = Object.fromEntries(
  GEO.map((state) => [
    state.code,
    state.districts.map((district) => ({
      id: sampleDistrictId(state.code, district.code),
      code: district.code,
      name: district.name,
    })),
  ]),
);

export const sampleCitiesByDistrict: Record<string, CityRef[]> = Object.fromEntries(
  GEO.flatMap((state) =>
    state.districts.map((district) => {
      const districtId = sampleDistrictId(state.code, district.code);
      return [
        districtId,
        district.cities.map((name) => ({ id: sampleCityId(districtId, name), name })),
      ] as const;
    }),
  ),
);

/** Departments — verbatim from the seed (slug / name / category). */
export const sampleDepartments: DepartmentRef[] = [
  { slug: "transport", name: "Transport Department (RTO)", category: "transport" },
  { slug: "registration-stamps", name: "Registration & Stamps Department", category: "land" },
  { slug: "revenue", name: "Revenue Department", category: "land" },
  { slug: "municipal", name: "Municipal Corporation / Urban Local Body", category: "municipal" },
  { slug: "police", name: "Police Department", category: "police" },
  { slug: "food-civil-supplies", name: "Food & Civil Supplies Department", category: "revenue" },
  { slug: "commercial-taxes", name: "Commercial Taxes / GST Department", category: "commerce" },
  { slug: "passport-seva", name: "Passport Seva (Ministry of External Affairs)", category: "commerce" },
];

export function findState(code: string): StateRef | null {
  return sampleStates.find((state) => state.code === code) ?? null;
}
export function findDistricts(stateCode: string): DistrictRef[] {
  return sampleDistrictsByState[stateCode] ?? [];
}
export function findDistrictByName(stateCode: string, name: string): DistrictRef | null {
  return findDistricts(stateCode).find((district) => district.name === name) ?? null;
}
export function findCities(districtId: string): CityRef[] {
  return sampleCitiesByDistrict[districtId] ?? [];
}
export function findDepartment(slug: string): DepartmentRef | null {
  return sampleDepartments.find((department) => department.slug === slug) ?? null;
}
