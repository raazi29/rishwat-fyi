/**
 * GapLegend — the choropleth's key: a five-step swatch ramp read left (lower
 * gap) to right (higher gap), matching `--color-ramp-1…5`. The direction is
 * stated in words as well as colour, and spelled out for screen readers.
 */

import { cn } from "@/lib/utils/cn";

const RAMP_BG = ["bg-ramp-1", "bg-ramp-2", "bg-ramp-3", "bg-ramp-4", "bg-ramp-5"];

export interface GapLegendProps {
  lowLabel?: string;
  highLabel?: string;
  /** Show the hatched "no published figure" key. Default true. */
  showNoData?: boolean;
  className?: string;
}

export function GapLegend({
  lowLabel = "Lower gap",
  highLabel = "Higher gap",
  showNoData = true,
  className,
}: GapLegendProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-2 text-micro text-ink-muted",
        className,
      )}
    >
      <span>{lowLabel}</span>
      <span
        className="flex overflow-hidden rounded-xs ring-1 ring-map-outline/40"
        aria-hidden="true"
      >
        {RAMP_BG.map((bg) => (
          <span key={bg} className={cn("h-2.5 w-5 sm:w-6", bg)} />
        ))}
      </span>
      <span>{highLabel}</span>
      {showNoData ? (
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-px w-4 bg-line sm:mx-1" />
          <span
            aria-hidden="true"
            className="h-2.5 w-5 rounded-xs bg-map-nodata ring-1 ring-map-outline/60 sm:w-6"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent 0 2px, var(--color-map-outline) 2px 3px)",
            }}
          />
          <span>No data yet</span>
        </span>
      ) : null}
      <span className="sr-only">
        Colour ramp from {lowLabel.toLowerCase()} to {highLabel.toLowerCase()}.
        {showNoData ? " Hatched states have no published figure yet." : ""}
      </span>
    </div>
  );
}
