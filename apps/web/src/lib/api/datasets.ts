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

import { apiBaseUrl, apiFetch, withSample, type Sourced } from "./client";
import { deriveTotals, type DatasetRow } from "./dataset-aggregate";
import type { DatasetIndex, Paginated, PlatformTotals, ServiceListItem, StateRef } from "./types";
import { sampleDatasetIndex } from "@/lib/fixtures/datasets";
import { samplePlatformTotals } from "@/lib/fixtures/aggregates";

export function getDatasetIndex(): Promise<Sourced<DatasetIndex>> {
  return withSample(
    () => apiFetch<DatasetIndex>("/datasets", { revalidate: 300 }),
    () => sampleDatasetIndex,
  );
}

/** Absolute URL of a raw dataset export, e.g. `/datasets/reports.csv`. */
export function datasetDownloadUrl(name: string, format: "csv" | "json"): string {
  return `${apiBaseUrl()}/datasets/${encodeURIComponent(name)}.${format}`;
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
    apiFetch<StateRef[]>("/locations/states", { revalidate: 300 }),
    apiFetch<DatasetRow[]>("/datasets/reports.json", { revalidate: 120 }),
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
  return {
    data: samplePlatformTotals,
    source: "sample",
    reason: failure.ok
      ? { code: "invalid_response", message: "Platform totals could not be computed." }
      : failure.error,
  };
}
