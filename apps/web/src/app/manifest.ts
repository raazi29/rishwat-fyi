import type { MetadataRoute } from "next";

/**
 * Web app manifest. The phone layout already has a bottom tab bar, so the site
 * reads as installable; this describes it honestly rather than dressing it up.
 * Only capabilities that actually exist are declared — no shortcuts to routes
 * that need a token, no screenshots that were never taken — and the icons are
 * the two that really exist (`icon.svg`, `apple-icon.tsx`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Rishwat.fyi — Government, as experienced by citizens",
    short_name: "Rishwat.fyi",
    description:
      "Search official government fees and timelines in India, and compare them with what citizens actually experience.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en-IN",
    dir: "ltr",
    categories: ["government", "education", "news"],
    // Light is the default: the product is a public record, read as a document.
    background_color: "#fcfcfb",
    theme_color: "#fcfcfb",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180", purpose: "any" },
    ],
  };
}
