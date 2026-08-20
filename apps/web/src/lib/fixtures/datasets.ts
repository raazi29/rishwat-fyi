/**
 * SAMPLE DATA — dataset index (the `/datasets` response).
 *
 * Structure and copy match `docs/api.md`. `generated_at` is a fixed sample
 * timestamp. The license line is provisional (PRODUCT.md marks the licence as
 * `[open]`) and is reproduced verbatim from the API's advertised value.
 */

import type { DatasetIndex } from "@/lib/api/types";
import { CITIZEN_REPORT_NOTICE } from "./aggregates";

export const sampleDatasetIndex: DatasetIndex = {
  datasets: [
    { name: "reports", format: "csv", url: "/datasets/reports.csv" },
    { name: "reports", format: "json", url: "/datasets/reports.json" },
  ],
  generated_at: "2026-08-20T00:00:00.000Z",
  license: "CC BY 4.0 (data) / MIT (code) — see docs/methodology.md",
  notice: CITIZEN_REPORT_NOTICE,
};
