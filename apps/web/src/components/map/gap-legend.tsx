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
  className?: string;
}

export function GapLegend({
  lowLabel = "Lower gap",
  highLabel = "Higher gap",
  className,
}: GapLegendProps) {
  return (
    <div className={cn("flex items-center gap-2 text-micro text-ink-muted", className)}>
      <span>{lowLabel}</span>
      <span className="flex overflow-hidden rounded-xs" aria-hidden="true">
        {RAMP_BG.map((bg) => (
          <span key={bg} className={cn("h-2.5 w-6", bg)} />
        ))}
      </span>
      <span>{highLabel}</span>
      <span className="sr-only">
        Colour ramp from {lowLabel.toLowerCase()} to {highLabel.toLowerCase()}.
      </span>
    </div>
  );
}
