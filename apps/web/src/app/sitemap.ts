import type { MetadataRoute } from "next";

import {
  getDatasetIndex,
  listDistricts,
  SampleFallbackDisabledError,
  listDepartments,
  listServices,
  listStates,
} from "@/lib/api";
import { SITE_URL } from "@/lib/site-url";

// Request-time rendering: the catalogue slugs come from the API, a separate
// deployment not guaranteed reachable while the site is being built (see
// app/page.tsx for the full rationale). Prerendering this at build time with the
// sample-data kill switch on (NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false) would fail
// the deploy on an unreachable API; worse, a build that *did* reach a degraded
// API could bake a catalogue-less sitemap in until the next deploy. Rendered on
// demand, the sitemap reflects the live catalogue and any API outage is transient.
export const dynamic = "force-dynamic";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

interface StaticRoute {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/**
 * The public surface, in priority order. Deliberately absent: `/admin/*` (the
 * authenticated moderator area, disallowed in `robots.ts`), `/report/submitted`
 * and `/reports/[publicId]` (reporter-specific pages that carry
 * `robots: { index: false }`).
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  // The search page is the product's primary verb; it ranks with /services.
  { path: "/search", changeFrequency: "daily", priority: 0.9 },
  { path: "/services", changeFrequency: "weekly", priority: 0.9 },
  { path: "/report", changeFrequency: "monthly", priority: 0.9 },
  { path: "/map", changeFrequency: "weekly", priority: 0.8 },
  { path: "/data", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/departments", changeFrequency: "weekly", priority: 0.7 },
  { path: "/states", changeFrequency: "weekly", priority: 0.7 },
  { path: "/report/status", changeFrequency: "monthly", priority: 0.6 },
  { path: "/data/api", changeFrequency: "monthly", priority: 0.6 },
  { path: "/data/dictionary", changeFrequency: "monthly", priority: 0.6 },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.6 },
  { path: "/moderation", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/governance", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contribute", changeFrequency: "monthly", priority: 0.5 },
  { path: "/mirroring", changeFrequency: "monthly", priority: 0.5 },
];

/**
 * Enumerating a catalogue is best-effort. This route renders at request time
 * (see `export const dynamic` above), so an unreachable API no longer fails the
 * build — the risk it guards against is now a request-time outage. With the
 * sample-data kill switch on (`NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false`) an
 * unreachable API throws; serving a sitemap that still lists the static surface
 * is far better than a route that 500s, and the next request re-enumerates once
 * the API is back. This catch is that defence in depth. Any other error is a
 * real bug and stays unhandled.
 */
async function enumerate<T>(
  load: () => Promise<{ data: T[] }>,
  toEntry: (item: T) => MetadataRoute.Sitemap[number],
): Promise<MetadataRoute.Sitemap> {
  try {
    const { data } = await load();
    return data.map(toEntry);
  } catch (error) {
    if (error instanceof SampleFallbackDisabledError) return [];
    throw error;
  }
}

/**
 * Sitemap covering the whole public surface plus a page for every service,
 * state and department in the catalogue. Slugs come from the API; the
 * catalogue is real even when the rest of the API is absent (it falls back to
 * the seeded sample), so the enumeration is normally complete.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use dataset snapshot date as lastModified for data-driven pages when available,
  // so Google sees a meaningful freshness signal tied to official verification updates
  // rather than a per-request now() that would mark every URL as always fresh.
  let datasetDate: Date | null = null;
  try {
    const idx = await getDatasetIndex();
    if (idx.source === "api" && idx.data.generated_at) {
      const parsed = new Date(idx.data.generated_at);
      if (!Number.isNaN(parsed.getTime())) datasetDate = parsed;
    }
  } catch {
    // best-effort: fallback to now
  }
  const dynamicLastModified = datasetDate ?? new Date();
  const staticLastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: staticLastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [serviceEntries, stateEntries, departmentEntries] = await Promise.all([
    enumerate(
      async () => ({ data: (await listServices({ per_page: 100 })).data.items }),
      (service) => ({
        url: `${SITE_URL}/services/${service.slug}`,
        lastModified: dynamicLastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        // Hint for image sitemap discovery (Next supports images array)
        images: [`${SITE_URL}/brand/illustration-official-vs-reported.webp`],
      }),
    ),
    enumerate(listStates, (state) => ({
      url: `${SITE_URL}/states/${state.code}`,
      lastModified: dynamicLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    enumerate(listDepartments, (department) => ({
      url: `${SITE_URL}/departments/${department.slug}`,
      lastModified: dynamicLastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]);

  // District pages — long-tail SEO (service × district). Best-effort: up to ~800 URLs.
  // Each district gets a dedicated landing `/states/[code]/[district]` (slugified).
  // If the catalogue is unavailable, districts are omitted rather than failing the sitemap.
  let districtEntries: MetadataRoute.Sitemap = [];
  try {
    const states = (await listStates()).data;
    // Fetch districts per state in parallel but capped to avoid thundering herd on cold start
    const perState = await Promise.all(
      states.map(async (state) => {
        try {
          const districts = (await listDistricts(state.code)).data;
          return districts.map((d) => {
            const slug = d.name
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .replace(/-+/g, "-");
            return {
              url: `${SITE_URL}/states/${state.code}/${slug}`,
              lastModified: dynamicLastModified,
              changeFrequency: "weekly" as const,
              priority: 0.5,
            } satisfies MetadataRoute.Sitemap[number];
          });
        } catch (e) {
          if (e instanceof SampleFallbackDisabledError) return [];
          throw e;
        }
      }),
    );
    districtEntries = perState.flat();
    // Safety cap: Next sitemaps have no hard limit but keep under 2k for now
    if (districtEntries.length > 2000) districtEntries = districtEntries.slice(0, 2000);
  } catch (e) {
    if (!(e instanceof SampleFallbackDisabledError)) throw e;
  }

  return [...staticEntries, ...serviceEntries, ...stateEntries, ...departmentEntries, ...districtEntries];
}
