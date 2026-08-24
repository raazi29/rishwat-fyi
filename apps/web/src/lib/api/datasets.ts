/**
 * Datasets resources.
 *
 * `getDatasetIndex` maps to `/datasets` (catalogue, 300s). `datasetDownloadUrl`
 * builds an absolute link to the raw export (the browser downloads it directly;
 * the API serves it `no-store`). `getPlatformTotals` has no dedicated endpoint,
 * so it is computed from real public data: the service catalogue for
 * `services_tracked`, and the published dataset export for report counts,
 * states covered and corroborated reports — the same figures any mirror would
 * compute. It falls back to the bundled sample only when the API is
 * unreachable.
 */

import {
  apiFetch,
  apiFetchList,
  publicApiBaseUrl,
  SampleFallbackDisabledError,
  sampleFallbackAllowed,
  withSample,
  type Sourced,
} from "./client";
import { deriveTotals, type DatasetRow } from "./dataset-aggregate";
import type {
  DatasetEntry,
  DatasetFormat,
  DatasetIndex,
  Paginated,
  PlatformTotals,
  ServiceListItem,
  StateRef,
} from "./types";
import { sampleDatasetIndex } from "@/lib/fixtures/datasets";
import { samplePlatformTotals } from "@/lib/fixtures/aggregates";

export function getDatasetIndex(): Promise<Sourced<DatasetIndex>> {
  return withSample(
    () => apiFetch<DatasetIndex>("/datasets", { revalidate: 300 }),
    () => sampleDatasetIndex,
  );
}

/** One downloadable file: a dataset paired with one of its serialisations. */
export interface DatasetDownload {
  name: string;
  description: string;
  format: DatasetFormat;
  url: string;
}

/**
 * Flatten the index into one row per downloadable file, which is how both
 * /data and /mirroring present it (a CSV button and a JSON button).
 *
 * Handles BOTH the live API shape (`formats: { csv, json }`) and the legacy
 * flat shape (`{ name, format, url }`) defensively — the helper is used at
 * render time and must never throw because a format was renamed or a fixture
 * still uses the old shape.
 *
 * Unknown format keys are ignored and only entries with a usable URL survive.
 * The URL is rebuilt with `datasetDownloadUrl` instead of using the API's own
 * absolute link because that link is built from the API's PUBLIC_BASE_URL, which
 * a misconfigured deployment can leave pointing at localhost.
 */
export function datasetDownloads(index: DatasetIndex): DatasetDownload[] {
  const known: DatasetFormat[] = ["csv", "json"];
  const entries: DatasetDownload[] = [];

  for (const entry of (index.datasets ?? []) as unknown as Record<string, unknown>[]) {
    // Live shape: { name, description, formats: { csv, json } }
    if (entry && typeof entry === "object" && "formats" in entry) {
      const e = entry as unknown as DatasetEntry;
      for (const format of known) {
        const maybe = e.formats?.[format];
        if (typeof maybe === "string" && maybe.length > 0) {
          entries.push({
            name: e.name,
            description: e.description,
            format,
            url: datasetDownloadUrl(e.name, format),
          });
        }
      }
      continue;
    }
    // Legacy flat shape: { name, format, url } — accept defensively
    if (
      entry &&
      typeof entry === "object" &&
      "format" in entry &&
      "url" in entry &&
      typeof (entry as Record<string, unknown>).format === "string" &&
      typeof (entry as Record<string, unknown>).url === "string"
    ) {
      const f = (entry as Record<string, unknown>).format as DatasetFormat;
      if (known.includes(f)) {
        entries.push({
          name: String((entry as Record<string, unknown>).name ?? "reports"),
          description: String((entry as Record<string, unknown>).description ?? ""),
          format: f,
          url: datasetDownloadUrl(String((entry as Record<string, unknown>).name ?? "reports"), f),
        });
      }
    }
  }

  // If nothing was derived (malformed index), fall back to at least the known
  // two files so the page still renders buttons rather than an empty state.
  if (entries.length === 0 && (index.datasets?.length ?? 0) === 0) {
    return [
      { name: "reports", description: "Publishable citizen reports, PII-redacted.", format: "csv", url: datasetDownloadUrl("reports", "csv") },
      { name: "reports", description: "Publishable citizen reports, PII-redacted.", format: "json", url: datasetDownloadUrl("reports", "json") },
    ];
  }

  return entries;
}

/**
 * Absolute URL of a raw dataset export, e.g. `/datasets/reports.csv`.
 *
 * Uses `publicApiBaseUrl()`, not `apiBaseUrl()`: this link is handed to a
 * browser to follow. If a deployment sets `API_BASE_URL` to a private/internal
 * origin for server-side fetches, that host is not resolvable from the reader's
 * machine and every download button would 404 for them.
 */
export function datasetDownloadUrl(name: string, format: "csv" | "json"): string {
  return `${publicApiBaseUrl()}/datasets/${encodeURIComponent(name)}.${format}`;
}

/**
 * The four figures in the home stat strip, derived from live public endpoints.
 * A partial failure degrades the whole strip to sample rather than mixing a
 * real count with an invented one.
 */
export async function getPlatformTotals(): Promise<Sourced<PlatformTotals>> {
  const [services, states, dataset] = await Promise.all([
    apiFetch<Paginated<ServiceListItem>>("/services", {
      query: { per_page: 100 },
      revalidate: 300,
    }),
    apiFetchList<StateRef>("/locations/states", "items", { revalidate: 300 }),
    apiFetchList<DatasetRow>("/datasets/reports.json", "rows", { revalidate: 120 }),
  ]);

  if (services.ok && states.ok && dataset.ok) {
    const totals = deriveTotals(dataset.data, states.data);
    return {
      data: {
        services_tracked: services.data.total,
        citizen_reports: totals.citizen_reports,
        states_covered: totals.states_covered,
        reports_corroborated: totals.reports_corroborated,
      },
      source: "api",
    };
  }

  const failure = !services.ok ? services : !states.ok ? states : dataset;

  // This function computes its totals by hand rather than going through
  // `withSample`, so it has to honour the kill switch by hand too. Without this,
  // an operator who set NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false would still get
  // invented "citizen reports / states covered / corroborated" figures in the
  // home-page hero during an outage — on the most-visited page on the site.
  if (!failure.ok && failure.error.code !== "not_found" && !sampleFallbackAllowed()) {
    throw new SampleFallbackDisabledError(failure.error);
  }

  return {
    data: samplePlatformTotals,
    source: "sample",
    reason: failure.ok
      ? { code: "invalid_response", message: "Platform totals could not be computed." }
      : failure.error,
  };
}
