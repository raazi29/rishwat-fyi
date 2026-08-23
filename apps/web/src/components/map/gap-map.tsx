/**
 * GapMap — the composed choropleth panel used on the home page (`variant="panel"`,
 * compact) and the `/map` page (`variant="full"`, larger, legend + list beside
 * the map). It derives everything from the API's `StateGap[]` model: median
 * additional-amount per state drives both the bins and the leaderboard.
 *
 * On phones the map keeps its aspect ratio and the list stacks below it.
 */

import type { StateGap } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { parseInr } from "@/lib/utils/format";

import { GapLegend } from "./gap-legend";
import { IndiaChoropleth, type ChoroplethVariant } from "./india-choropleth";
import { StateGapList, type StateGapItem } from "./state-gap-list";

export interface GapMapProps {
  states: StateGap[];
  variant?: ChoroplethVariant;
  title?: string;
  subtitle?: string;
  /** Target for the "View all states" action. */
  viewAllHref?: string;
  /** Per-state link builder. Defaults to `/states/{code}`. */
  stateHref?: (code: string) => string;
  /** Tooltip anchor id; set when more than one map is on a page. */
  id?: string;
  /** Hide the internal header when the surrounding section already names it. */
  showHeader?: boolean;
  className?: string;
}

export function GapMap({
  states,
  variant = "panel",
  title = "Where are the biggest gaps?",
  subtitle = "Based on additional amount reported",
  viewAllHref,
  stateHref = (code) => `/states/${code}`,
  id,
  showHeader = true,
  className,
}: GapMapProps) {
  const values: Record<string, number | null> = {};
  const items: StateGapItem[] = [];
  for (const state of states) {
    const value = parseInr(state.additional_amount_median);
    values[state.code] = value;
    items.push({ code: state.code, name: state.name, value, href: stateHref(state.code) });
  }

  const hrefForState = (code: string) => stateHref(code);
  const isFull = variant === "full";

  return (
    <section className={cn("flex min-w-0 flex-col", className)}>
      {showHeader ? (
        <header className="mb-4">
          <h3 className="font-serif text-h3 font-bold text-ink">{title}</h3>
          <p className="text-label text-ink-muted">{subtitle}</p>
        </header>
      ) : null}

      <GapLegend className="mb-4" />

      <div
        className={cn(
          "grid min-w-0 gap-6",
          isFull
            ? "lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-12"
            : "sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start",
        )}
      >
        <IndiaChoropleth
          values={values}
          hrefForState={hrefForState}
          variant={variant}
          {...(id ? { id } : {})}
          caption={title}
          className={isFull ? "mx-auto min-w-0 w-full max-w-md lg:mx-0" : "min-w-0"}
        />
        <StateGapList
          items={items}
          limit={isFull ? 10 : 5}
          title={isFull ? "States by reported gap" : "Top 5 states by reported gap"}
          {...(viewAllHref ? { viewAllHref } : {})}
          className="min-w-0"
        />
      </div>
    </section>
  );
}
