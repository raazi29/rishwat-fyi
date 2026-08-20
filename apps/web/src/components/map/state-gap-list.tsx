/**
 * StateGapList — the ranked leaderboard beside the choropleth. It restates the
 * map as plain numbers so the data survives without colour: a numbered list of
 * the highest-gap states with right-aligned ₹ values, and a "View all states →"
 * action. Values are shown as text (ink), so colour is never the only signal.
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
  const ranked = [...items]
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
    .slice(0, limit);

  return (
    <div className={cn("flex flex-col", className)}>
      {title ? (
        <h3 className="mb-2 text-label font-semibold text-ink">{title}</h3>
      ) : null}
      <ol className="flex flex-col">
        {ranked.map((item, index) => {
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
              <span className="w-4 shrink-0 text-label tabular text-ink-muted">{index + 1}</span>
              <span className="min-w-0 flex-1 text-ink">{name}</span>
              <span className="shrink-0 text-label font-semibold tabular text-ink">
                {formatValue(item.value)}
              </span>
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
