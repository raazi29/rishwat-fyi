// Seed data shapes. Kept dependency-free so seed content files (locations,
// services) never import Drizzle — the runner (./index.ts) is the only place
// that touches the database. Field names deliberately mirror the DB columns
// (snake_case) where a value maps 1:1 to a column, and camelCase for the
// slug/url references the runner resolves into foreign keys.

export interface StateSeed {
  /** ISO 3166-2:IN suffix, e.g. "UP", "DL", "TN". */
  code: string;
  name: string;
  districts: DistrictSeed[];
}

export interface DistrictSeed {
  /** Slug of the district name; unique within a state. */
  code: string;
  name: string;
  cities: string[];
}

export interface DepartmentSeed {
  slug: string;
  name: string;
  description: string;
  category: string;
}

export interface SourceSeed {
  url: string;
  title: string;
  department: string;
}

export interface ServiceSeed {
  slug: string;
  name: string;
  departmentSlug: string;
  description: string;
  /** Rupee amount as a numeric string, or "" when the official fee is variable
   *  (percentage-based / slab-based). The runner converts "" to SQL NULL. */
  official_fee_inr: string;
  official_timeline_days: number;
  official_visits: number;
  official_documents: { name: string; required: boolean }[];
  process_steps: { order: number; title: string; description: string }[];
  feeSourceUrl: string;
  timelineSourceUrl: string;
}

export interface OfficeSeed {
  /** Slug of the service this office delivers (resolved to service_id). */
  serviceSlug: string;
  /** ISO 3166-2:IN state suffix, e.g. "UP" (resolved to state_id). */
  stateCode: string;
  /** District name exactly as seeded; resolved to district_id via
   *  (state_id, slugify(districtName)). Must match a seeded district. */
  districtName: string;
  /** Real, publicly verifiable office name — never invented. */
  name: string;
  /** Street/area address when confidently known, otherwise null. */
  address?: string | null;
  /** Point coordinate as { lat, lon }, or null when the exact location is not
   *  confidently known. Public honesty rule: prefer null over a guessed point. */
  location?: { lat: number; lon: number } | null;
}
