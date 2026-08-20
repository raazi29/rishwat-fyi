"use client";

import { DeltaFigure, Panel } from "@/components/ui";
import { ClockIcon, RupeeIcon, VisitsIcon } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

/**
 * THE GAP — the system's signature panel and its single authored motion moment
 * (DESIGN.md §Components). On first view the connecting seam rules draw and the
 * three delta values settle upward once, ≤400ms, exponential ease-out. All of
 * it is disabled under `prefers-reduced-motion` by the global reset in
 * globals.css, which zeroes animation durations. The `=` seam glyphs appear
 * only when the four overview panels sit in one row (≥1200px).
 */

export interface GapRow {
  value: string;
  qualifier: string;
}

const SETTLE = "gap-settle 360ms var(--ease-settle) both";
const RULE = "gap-rule 320ms var(--ease-settle) both";

export function GapPanel({
  amount,
  timeline,
  visits,
  className,
}: {
  amount: GapRow;
  timeline: GapRow;
  visits: GapRow;
  className?: string;
}) {
  const rows: Array<{ icon: React.ReactNode; label: string } & GapRow> = [
    { icon: <RupeeIcon />, label: "Additional amount reported", ...amount },
    { icon: <ClockIcon />, label: "Timeline (median)", ...timeline },
    { icon: <VisitsIcon />, label: "Visits (median)", ...visits },
  ];

  return (
    <Panel className={cn("relative p-6", className)}>
      {/* Seam rules that "draw" on first view; only meaningful in the one-row layout. */}
      <span
        aria-hidden="true"
        style={{ animation: RULE, transformOrigin: "right" }}
        className="absolute -left-px top-1/2 hidden h-6 -translate-y-1/2 border-l-2 border-line-inner min-[1200px]:block"
      />
      <span
        aria-hidden="true"
        style={{ animation: RULE, transformOrigin: "left" }}
        className="absolute -right-px top-1/2 hidden h-6 -translate-y-1/2 border-r-2 border-line-inner min-[1200px]:block"
      />
      <span
        aria-hidden="true"
        className="absolute -left-2.5 top-1/2 hidden -translate-y-1/2 font-serif text-body text-ink-muted min-[1200px]:block"
      >
        =
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 font-serif text-body text-ink-muted min-[1200px]:block"
      >
        =
      </span>

      <div className="text-center">
        <h3 className="font-serif text-h2 font-bold tracking-tight text-ink">THE GAP</h3>
        <p className="mt-0.5 text-label text-ink-muted">What citizens actually experience</p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {rows.map((row, index) => (
          <div key={row.label} style={{ animation: SETTLE, animationDelay: `${index * 80}ms` }}>
            <DeltaFigure icon={row.icon} label={row.label} value={row.value} qualifier={row.qualifier} />
          </div>
        ))}
      </div>
    </Panel>
  );
}
