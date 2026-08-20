import type { DistrictSeed, StateSeed } from "../types.js";

/** Lowercase, hyphenated slug used as the district `code` (unique per state). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Compact district builder. When no cities are given, the district
 * headquarters (same name as the district) is used as the single city —
 * that is a real place, so every district gets at least one valid city.
 */
export function d(name: string, ...cities: string[]): DistrictSeed {
  return { code: slugify(name), name, cities: cities.length ? cities : [name] };
}

/** State/UT builder. */
export function state(code: string, name: string, districts: DistrictSeed[]): StateSeed {
  return { code, name, districts };
}
