/**
 * SAMPLE DATA — per-state reported gaps for the choropleth and leaderboard.
 * ILLUSTRATIVE, NOT LIVE. Every median and count here is synthetic sample data
 * (PRODUCT.md lists per-state gap figures as sample-only — there is no public
 * endpoint that aggregates them).
 *
 * Covers all 15 sample states. Three states (Kerala, Haryana, Assam) are below
 * the publishing threshold, so their `additional_amount_median` is `null` while
 * the raw `report_count` still shows — consistent with `states_covered: 12`.
 */

import type { Inr, StateGap } from "@/lib/api/types";
import { sampleStates } from "./geo";

const NAME: Record<string, string> = Object.fromEntries(
  sampleStates.map((state) => [state.code, state.name]),
);

function gap(
  code: string,
  additional_amount_median: Inr | null,
  report_count: number,
  services_covered: number,
  districts_covered: number,
): StateGap {
  return {
    code,
    name: NAME[code] ?? code,
    additional_amount_median,
    report_count,
    services_covered,
    districts_covered,
  };
}

export const sampleStateGaps: StateGap[] = [
  gap("BR", "4200.00", 268, 10, 5),
  gap("MP", "3800.00", 176, 9, 5),
  gap("UP", "3500.00", 412, 11, 12),
  gap("RJ", "3000.00", 158, 9, 5),
  gap("WB", "2600.00", 197, 9, 5),
  gap("MH", "2200.00", 341, 11, 7),
  gap("TG", "2100.00", 134, 8, 5),
  gap("KA", "1900.00", 223, 10, 6),
  gap("GJ", "1800.00", 164, 8, 5),
  gap("PB", "1600.00", 96, 7, 5),
  gap("TN", "1500.00", 152, 8, 5),
  gap("DL", "1200.00", 209, 10, 6),
  // Below threshold — raw count shows, median stays null.
  gap("KL", null, 2, 1, 1),
  gap("HR", null, 1, 1, 1),
  gap("AS", null, 0, 0, 0),
];

/** Top states by reported gap, for the home leaderboard (published only). */
export function topStateGaps(limit = 5): StateGap[] {
  return sampleStateGaps
    .filter((state) => state.additional_amount_median !== null)
    .slice(0, limit);
}
