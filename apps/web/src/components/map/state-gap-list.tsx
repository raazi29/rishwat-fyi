/**
 * StateGapList — the ranked leaderboard beside the choropleth. It restates the
 * map as plain numbers so the data survives without colour: the highest-gap
 * states numbered with right-aligned ₹ values, and a "View all states →"
 * action. Values are shown as text (ink), so colour is never the only signal.
 *
 * States below the publishing threshold carry no figure. They sort last, keep
 * their name but not a rank number, and show an accessible "not enough reports
 * yet" marker rather than a bare dash. When no state is published at all, a
 * leading line names the reason so the list never reads as broken or as zeros.
 */

import Link from "next/link";

import { ActionLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatInr } from "@/lib/utils/format";

export interface StateGapItem {
  code: string;
  name: string;
  /** Gap in rupees, or `null` when below the publishing threshold. */
  value: number | null;
  href?: string;
}

export interface StateGapListProps {
  items: StateGapItem[];
  limit?: number;
  title?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  formatValue?: (value: number | null) => string;
  className?: string;
}

const defaultFormat = (value: number | null): string => (value === null ? "—" : formatInr(value));

export function StateGapList({
  items,
  limit = 5,
  title = "Top 5 states by reported gap",
  viewAllHref,
  viewAllLabel = "View all states",
  formatValue = defaultFormat,
  className,
}: StateGapListProps) {
  // Established ordering (mirrors geo/state-metric.ts `rankStates` and the
  // geo/state-list comparator): states with a published figure rank
  // highest-first; states below the publishing threshold sort last with a name
  // tiebreak. The previous `(b.value ?? -Infinity)` subtraction returned NaN
  // when both values were null, so a list where nothing is published was left
  // in arbitrary, render-dependent order.
  const ranked = [...items]
    .sort((a, b) => {
      if (a.value === null && b.value === null) return a.name.localeCompare(b.name);
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  const rankedWithData = ranked.filter((item) => item.value !== null).length;
  // When nothing is published, a numbered "top gaps" leaderboard is a column of
  // dashes implying a ranking that does not exist — name the reason up front
  // instead of presenting a broken-looking list (DESIGN.md: never a shrug).
  const allEmpty = ranked.length > 0 && rankedWithData === 0;

  return (
    <div className={cn("flex flex-col", className)}>
      {title ? (
        <h3 className="mb-2 text-label font-semibold text-ink">{title}</h3>
      ) : null}
      {allEmpty ? (
        <p className="mb-2 text-label text-ink-muted">
          No state has reached the publishing threshold yet.
        </p>
      ) : null}
      <ol className="flex flex-col">
        {ranked.map((item, index) => {
          const hasValue = item.value !== null;
          const name = item.href ? (
            <Link
              href={item.href}
              className="truncate underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-current"
            >
              {item.name}
            </Link>
          ) : (
            <span className="truncate">{item.name}</span>
          );
          return (
            <li
              key={item.code}
              className="flex items-center gap-3 border-t border-line-inner py-2 text-body first:border-t-0"
            >
              {/* Rank only the states with a published figure; below-threshold
                  states keep the gutter for alignment but never a rank number,
                  which would imply they placed. Data rows sort first, so the
                  positional index is the rank. */}
              <span className="w-4 shrink-0 text-label tabular text-ink-muted">
                {hasValue ? index + 1 : ""}
              </span>
              <span className={cn("min-w-0 flex-1", hasValue ? "text-ink" : "text-ink-muted")}>
                {name}
              </span>
              {hasValue ? (
                <span className="shrink-0 text-label font-semibold tabular text-ink">
                  {formatValue(item.value)}
                </span>
              ) : (
                // Label the missing figure for assistive tech; never a bare, bold
                // ink dash that could read as a real (or zero) value.
                <span className="shrink-0 text-label text-ink-muted">
                  <span aria-hidden="true">{"\u2014"}</span>
                  <span className="sr-only">Not enough reports yet</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {viewAllHref ? (
        <ActionLink href={viewAllHref} className="mt-3">
          {viewAllLabel}
        </ActionLink>
      ) : null}
    </div>
  );
}
