/**
 * ChartFrame — shared chrome for every chart: a sans title (the record's
 * operational voice), an optional subtitle, the sage "Median" chip top-right
 * from the reference boards, and an optional swatch legend. The chart SVG and
 * its visually-hidden table fallback are passed in as children.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

import { slugId, TONE_BG, type Tone } from "./scale";

export interface ChartLegendItem {
  label: string;
  tone: Tone;
}

export interface ChartFrameProps {
  title: string;
  subtitle?: string;
  /** Renders the top-right chip, e.g. `{ value: "21 days" }`. */
  median?: { value: string; label?: string };
  legend?: ChartLegendItem[];
  /** The chart SVG. */
  children: ReactNode;
  /** A visually-hidden `<table>` fallback. */
  table?: ReactNode;
  /** Override the generated aria id (needed if two charts share a title). */
  titleId?: string;
  className?: string;
}

export function ChartFrame({
  title,
  subtitle,
  median,
  legend,
  children,
  table,
  titleId,
  className,
}: ChartFrameProps) {
  const id = titleId ?? slugId(title);
  return (
    <figure className={cn("flex flex-col", className)} aria-labelledby={id}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={id} className="text-h3 font-semibold text-ink">
            {title}
          </h3>
          {subtitle ? <p className="text-label text-ink-muted">{subtitle}</p> : null}
        </div>
        {median ? (
          <div className="shrink-0 rounded-md bg-sage px-3 py-1.5 text-right">
            <div className="text-body-lg font-semibold leading-none tabular text-ink">
              {median.value}
            </div>
            <div className="mt-1 text-micro font-semibold uppercase tracking-[0.08em] text-official-mid">
              {median.label ?? "Median"}
            </div>
          </div>
        ) : null}
      </div>

      {legend && legend.length > 0 ? (
        <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {legend.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-1.5 text-micro text-ink-secondary"
            >
              <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-xs", TONE_BG[item.tone])} />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      {children}
      {table}
    </figure>
  );
}
