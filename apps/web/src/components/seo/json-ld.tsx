import { datasetDownloadUrl } from "@/lib/api";
import { SITE_URL } from "@/lib/site-url";

/**
 * JSON-LD structured data (schema.org) emitted as `<script type="application/ld+json">`
 * tags. These are server components: the markup is present in the initial HTML,
 * which is what crawlers read, and nothing here needs the client bundle.
 *
 * Every absolute URL is derived — the site's own URLs from `SITE_URL`
 * (build-time canonical origin, no trailing slash) and dataset download URLs
 * from `datasetDownloadUrl` (the PUBLIC API origin, the same links the /data
 * download buttons use) — so a mirror on its own domain, or a deployment whose
 * API lives elsewhere, describes itself correctly without editing this file.
 */

/** The organisation / brand name, reused across every graph. */
const ORG_NAME = "Rishwat.fyi";

/** External profile for `Organization.sameAs`. Not a site URL, so not derived. */
const GITHUB_URL = "https://github.com/raazi29/rishwat-fyi";

/**
 * Serialise a JSON-LD graph for inline embedding.
 *
 * `<` is escaped to its unicode form so a value can never terminate the
 * enclosing `</script>` early. Every value emitted here is controlled (constants
 * or `SITE_URL`, plus breadcrumb items supplied by our own pages), so this is
 * defence-in-depth rather than a live user-input sink — but it costs nothing and
 * keeps the boundary safe if a caller later passes dynamic text.
 */
function serialize(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Render one `application/ld+json` script. Not exported — used by the graphs below. */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}

/** Resolve a site-relative path (`/services`) to an absolute URL; pass absolutes through. */
function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Organization graph for the site root. Identifies the publisher behind every
 * page and its canonical logo.
 */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: ORG_NAME,
        url: SITE_URL,
        description:
          "Open government transparency infrastructure for India. Citizen-reported data on government service costs, delays, and procedures.",
        logo: `${SITE_URL}/brand/mark.svg`,
        sameAs: [GITHUB_URL],
      }}
    />
  );
}

/**
 * WebSite graph for the site root, including the sitelinks `SearchAction` that
 * points a query at the site's own search page.
 */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: ORG_NAME,
        url: SITE_URL,
        description:
          "Search official government fees and timelines in India, and compare them with what citizens actually experience.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

/**
 * Dataset graph for /data. The `distribution` links point at the real CSV and
 * JSON exports on the public API origin — the same URLs the download buttons
 * resolve to — so a dataset search engine follows a working link.
 */
export function DatasetJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Rishwat.fyi Citizen Reports Dataset",
        description:
          "Anonymised, moderated citizen reports on government service experiences in India — fees, delays, visits, and procedural friction.",
        url: `${SITE_URL}/data`,
        license: "https://creativecommons.org/licenses/by/4.0/",
        creator: { "@type": "Organization", name: ORG_NAME },
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: datasetDownloadUrl("reports", "csv"),
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: datasetDownloadUrl("reports", "json"),
          },
        ],
        spatialCoverage: "India",
        temporalCoverage: "2024/..",
      }}
    />
  );
}

/** One crumb: a label and the page it points to (absolute or site-relative). */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * BreadcrumbList graph. Accepts an ordered `items` array (`Home > Page`) and
 * emits a positioned `ListItem` for each, resolving relative URLs to absolute.
 * Renders nothing for an empty list.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: toAbsoluteUrl(item.url),
        })),
      }}
    />
  );
}
