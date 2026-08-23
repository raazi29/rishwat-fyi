import type { MetadataRoute } from "next";

/**
 * Web app manifest. The phone layout already has a bottom tab bar, so the site
 * reads as installable; this describes it honestly rather than dressing it up.
 * Only capabilities that actually exist are declared — no shortcuts to routes
 * that need a token, no screenshots that were never taken.
 *
 * The icons are the generated brand tiles (see `public/brand/README.md`). Both
 * purposes are declared because they are genuinely different images: `any` keeps
 * the tile's own rounded corners, `maskable` is full-bleed official green with
 * the mark inside the safe zone, so an Android launcher that crops to a circle
 * never clips the R.
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
      { src: "/brand/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/brand/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      {
        src: "/brand/icon-maskable-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
