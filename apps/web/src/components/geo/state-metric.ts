/**
 * The per-state metric model shared by /map and /states.
 *
 * The public data model (`StateGap`) carries two comparable per-state figures:
 * the median additional amount reported and the report count. It does NOT carry
 * a per-state delay median, so the "delay" metric is marked `available: false`
 * and its value resolves to `null` everywhere — the UI then shows the honest
 * "not published yet" marker instead of a fabricated or zero figure
 * (build-contract: never render a computed value the API returned as null).
 */

import type { StateGap } from "@/lib/api/types";
import { formatCount, formatInr, parseInr } from "@/lib/utils/format";

export type StateMetric = "amount" | "delay" | "reports";

export const DEFAULT_STATE_METRIC: StateMetric = "amount";

export interface StateMetricConfig {
  key: StateMetric;
  /** Full label for the switcher. */
  label: string;
  /** Compact label for tight layouts. */
  shortLabel: string;
  legendLow: string;
  legendHigh: string;
  /** Whether the public data model carries this figure per state. */
  available: boolean;
  /** Shown when `available` is false, so the empty view says why. */
  unavailableNote?: string;
}

export const STATE_METRICS: readonly StateMetricConfig[] = [
  {
    key: "amount",
    label: "Additional amount reported",
    shortLabel: "Additional amount",
    legendLow: "Lower gap",
    legendHigh: "Higher gap",
    available: true,
  },
  {
    key: "delay",
    label: "Reported delay",
    shortLabel: "Reported delay",
    legendLow: "Shorter delay",
    legendHigh: "Longer delay",
    available: false,
    unavailableNote:
      "A per-state median delay is not part of the published data yet. It will appear here once the dataset aggregates it.",
  },
  {
    key: "reports",
    label: "Reports per state",
    shortLabel: "Reports",
    legendLow: "Fewer reports",
    legendHigh: "More reports",
    available: true,
  },
] as const;

const CONFIG_BY_KEY: Record<StateMetric, StateMetricConfig> = STATE_METRICS.reduce(
  (map, config) => {
    map[config.key] = config;
    return map;
  },
  {} as Record<StateMetric, StateMetricConfig>,
);

const VALID_METRICS = new Set<string>(STATE_METRICS.map((config) => config.key));

/** Normalise a raw `?metric=` param to a known metric, defaulting to amount. */
export function readStateMetric(raw: string | string[] | undefined): StateMetric {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && VALID_METRICS.has(value) ? (value as StateMetric) : DEFAULT_STATE_METRIC;
}

export function stateMetricConfig(metric: StateMetric): StateMetricConfig {
  return CONFIG_BY_KEY[metric];
}

/**
 * The numeric value that drives the choropleth bin and the ranking for a
 * metric. `null` means "no comparable figure" (below threshold, or a metric the
 * data model does not carry) and must render as the not-enough-data marker.
 */
export function metricValue(gap: StateGap, metric: StateMetric): number | null {
  switch (metric) {
    case "amount":
      return parseInr(gap.additional_amount_median);
    case "reports":
      return gap.report_count;
    case "delay":
      return null;
  }
}

/** Format a metric value for display; `null` becomes the em dash marker. */
export function formatMetricValue(metric: StateMetric, value: number | null): string {
  if (value === null) return "\u2014";
  switch (metric) {
    case "amount":
      return formatInr(value);
    case "reports":
      return formatCount(value);
    case "delay":
      return "\u2014";
  }
}

/**
 * Rank states for a metric: highest value first, states with no value last,
 * with a stable tiebreak on report count then name so the order is
 * deterministic across renders.
 */
export function rankStates(states: readonly StateGap[], metric: StateMetric): StateGap[] {
  return [...states].sort((a, b) => {
    const av = metricValue(a, metric);
    const bv = metricValue(b, metric);
    if (av !== bv) {
      if (av === null) return 1;
      if (bv === null) return -1;
      if (bv !== av) return bv - av;
    }
    if (b.report_count !== a.report_count) return b.report_count - a.report_count;
    return a.name.localeCompare(b.name);
  });
}
