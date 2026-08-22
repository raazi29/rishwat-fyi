import type { MetadataRoute } from "next";

import { SampleFallbackDisabledError, listDepartments, listServices, listStates } from "@/lib/api";

// Request-time rendering: the catalogue slugs come from the API, a separate
// deployment not guaranteed reachable while the site is being built (see
// app/page.tsx for the full rationale). Prerendering this at build time with the
// sample-data kill switch on (NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false) would fail
// the deploy on an unreachable API; worse, a build that *did* reach a degraded
// API could bake a catalogue-less sitemap in until the next deploy. Rendered on
// demand, the sitemap reflects the live catalogue and any API outage is transient.
export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

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
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [serviceEntries, stateEntries, departmentEntries] = await Promise.all([
    enumerate(
      async () => ({ data: (await listServices({ per_page: 100 })).data.items }),
      (service) => ({
        url: `${SITE_URL}/services/${service.slug}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    ),
    enumerate(listStates, (state) => ({
      url: `${SITE_URL}/states/${state.code}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    enumerate(listDepartments, (department) => ({
      url: `${SITE_URL}/departments/${department.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]);

  return [...staticEntries, ...serviceEntries, ...stateEntries, ...departmentEntries];
}
