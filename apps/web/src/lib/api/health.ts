/**
 * Health resource. `GET /health`.
 *
 * When the API is unreachable the sample reports the honest offline state
 * (`degraded` / `down`), tagged `source: "sample"` so the UI never implies the
 * backend answered.
 */

import { apiFetch, withSample, type Sourced } from "./client";
import type { HealthResponse } from "./types";

export function getHealth(): Promise<Sourced<HealthResponse>> {
  return withSample(
    () => apiFetch<HealthResponse>("/health", { revalidate: 0 }),
    () => ({ status: "degraded", database: "down", time: "2026-08-20T00:00:00.000Z" }),
  );
}
