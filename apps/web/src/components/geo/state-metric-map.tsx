import type { StateGap } from "@/lib/api/types";
import { GapLegend, IndiaChoropleth, StateGapList, type StateGapItem } from "@/components/map";
import { EmptyState } from "@/components/ui";
import { EyeOffIcon } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

import { formatMetricValue, metricValue, stateMetricConfig, type StateMetric } from "./state-metric";

/**
 * The choropleth panel for a chosen metric. It composes the same three map
 * primitives as `GapMap` (IndiaChoropleth + GapLegend + StateGapList), but
 * parameterised by metric so the "reports per state" and "additional amount"
 * views recolour and re-rank correctly — `GapMap` alone always reads the
 * additional-amount field. When a metric has no published per-state figure
 * (delay), it renders an honest empty panel rather than an all-grey map.
 */
export function StateMetricMap({
  states,
  metric,
  variant = "panel",
  stateHref = (code) => `/states/${code}`,
  viewAllHref,
  id = "state-metric-map",
  listTitle,
  className,
}: {
  states: readonly StateGap[];
  metric: StateMetric;
  variant?: "panel" | "full";
  stateHref?: (code: string) => string;
  viewAllHref?: string;
  id?: string;
  listTitle?: string;
  className?: string;
}) {
  const config = stateMetricConfig(metric);

  if (!config.available) {
    return (
      <div className={cn("rounded-lg border border-line bg-surface", className)}>
        <EmptyState
          icon={<EyeOffIcon />}
          title="Not published for this metric yet"
          description={config.unavailableNote}
        />
      </div>
    );
  }

  const values: Record<string, number | null> = {};
  const items: StateGapItem[] = [];
  for (const state of states) {
    const value = metricValue(state, metric);
    values[state.code] = value;
    items.push({ code: state.code, name: state.name, value, href: stateHref(state.code) });
  }

  const formatValue = (value: number | null): string =>
    value === null ? "No data" : formatMetricValue(metric, value);
  const listFormat = (value: number | null): string =>
    value === null ? "\u2014" : formatMetricValue(metric, value);
  const isFull = variant === "full";

  return (
    <div className={cn("flex flex-col", className)}>
      <GapLegend lowLabel={config.legendLow} highLabel={config.legendHigh} className="mb-4" />
      <div
        className={cn(
          "grid gap-6",
          isFull
            ? "lg:grid-cols-[minmax(0,1.5fr)_20rem] lg:items-start lg:gap-10"
            : "sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-start",
        )}
      >
        <IndiaChoropleth
          values={values}
          hrefForState={stateHref}
          variant={variant}
          id={id}
          caption={`States coloured by ${config.label.toLowerCase()}`}
          formatValue={formatValue}
          className={isFull ? "sm:max-w-xl" : undefined}
        />
        <StateGapList
          items={items}
          limit={isFull ? 10 : 5}
          title={listTitle ?? (isFull ? `States by ${config.shortLabel.toLowerCase()}` : "Top 5 states")}
          formatValue={listFormat}
          {...(viewAllHref ? { viewAllHref } : {})}
        />
      </div>
    </div>
  );
}
