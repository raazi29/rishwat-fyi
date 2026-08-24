/**
 * SAMPLE DATA — dataset index (the `/datasets` response).
 *
 * Structure and copy match `docs/api.md`. `generated_at` is a fixed sample
 * timestamp. The license line is provisional (PRODUCT.md marks the licence as
 * `[open]`) and is reproduced verbatim from the API's advertised value.
 */

import type { DatasetIndex } from "@/lib/api/types";

export const sampleDatasetIndex: DatasetIndex = {
  datasets: [
    {
      name: "reports",
      description: "Publishable citizen reports, PII-redacted.",
      formats: {
        csv: "/datasets/reports.csv",
        json: "/datasets/reports.json",
      },
    },
  ],
  generated_at: "2026-08-20T00:00:00.000Z",
  license: "Data: CC BY 4.0 (see LICENSE-DATA). Code: MIT (see LICENSE).",
};
