import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

/**
 * robots.txt — the public data is meant to be found and mirrored, so crawling
 * is allowed everywhere except the authenticated moderator surface (`/admin`).
 * The sitemap is advertised so crawlers can enumerate every service page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
