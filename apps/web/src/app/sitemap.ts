import type { MetadataRoute } from "next";

import { listServices } from "@/lib/api";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

interface StaticRoute {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/**
 * The public surface, in priority order. `/admin` is intentionally absent — it
 * is the authenticated moderator area and is disallowed in `robots.ts`.
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
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
 * Sitemap covering the whole public surface plus a page for every service in
 * the catalogue. Service slugs come from `listServices`; the catalogue is real
 * even when the rest of the API is absent (it falls back to the seeded sample),
 * so the enumeration is always complete.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const services = await listServices({ per_page: 100 });
  const serviceEntries: MetadataRoute.Sitemap = services.data.items.map((service) => ({
    url: `${SITE_URL}/services/${service.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...serviceEntries];
}
