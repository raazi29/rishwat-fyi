import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { STATE_METRICS, type StateMetric } from "./state-metric";

/**
 * The map's metric switch, implemented as a group of links that set `?metric=`
 * so it works with no client JavaScript and the server re-renders the map,
 * legend and table for the chosen metric. Each link is a ≥44px target and the
 * active one is marked with `aria-current`, so the state is carried by more than
 * colour alone.
 */
export function MetricSwitcher({
  current,
  basePath = "/map",
  className,
}: {
  current: StateMetric;
  basePath?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Colour the map by"
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1",
        className,
      )}
    >
      {STATE_METRICS.map((metric) => {
        const active = metric.key === current;
        return (
          <Link
            key={metric.key}
            href={metric.key === "amount" ? basePath : `${basePath}?metric=${metric.key}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3.5 text-label font-medium transition-colors duration-150",
              active
                ? "bg-official text-white"
                : "text-ink-secondary hover:bg-sunken hover:text-ink",
            )}
          >
            {metric.label}
          </Link>
        );
      })}
    </div>
  );
}
