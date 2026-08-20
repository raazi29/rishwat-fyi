/**
 * Region classification for grouping states, following the Government of India
 * Zonal Council groupings (Northern / Central / Eastern / Western / Southern /
 * North Eastern). Keyed by ISO 3166-2:IN code so it lines up with `StateGap.code`
 * and the choropleth geometry. Unknown codes fall back to "Other" rather than
 * being dropped — the list on /states must never silently lose a state.
 */

export type Region = "North" | "Central" | "East" | "West" | "South" | "Northeast" | "Other";

/** Display order for region groups. */
export const REGION_ORDER: readonly Region[] = [
  "North",
  "Central",
  "East",
  "West",
  "South",
  "Northeast",
  "Other",
] as const;

const REGION_LABELS: Record<Region, string> = {
  North: "Northern India",
  Central: "Central India",
  East: "Eastern India",
  West: "Western India",
  South: "Southern India",
  Northeast: "North-Eastern India",
  Other: "Other states and territories",
};

/** ISO 3166-2:IN code → region. */
const REGION_BY_CODE: Record<string, Region> = {
  // Northern
  CH: "North",
  DL: "North",
  HR: "North",
  HP: "North",
  JK: "North",
  LA: "North",
  PB: "North",
  RJ: "North",
  // Central
  CT: "Central",
  MP: "Central",
  UP: "Central",
  UT: "Central",
  // Eastern
  BR: "East",
  JH: "East",
  OR: "East",
  WB: "East",
  // Western
  GA: "West",
  GJ: "West",
  MH: "West",
  DH: "West",
  DN: "West",
  DD: "West",
  // Southern
  AP: "South",
  KA: "South",
  KL: "South",
  TN: "South",
  TG: "South",
  PY: "South",
  LD: "South",
  AN: "South",
  // North-Eastern
  AS: "Northeast",
  AR: "Northeast",
  MN: "Northeast",
  ML: "Northeast",
  MZ: "Northeast",
  NL: "Northeast",
  TR: "Northeast",
  SK: "Northeast",
};

/** The region a state belongs to, defaulting to "Other" for unmapped codes. */
export function regionOf(code: string): Region {
  return REGION_BY_CODE[code] ?? "Other";
}

/** A human label for a region group heading. */
export function regionLabel(region: Region): string {
  return REGION_LABELS[region];
}
