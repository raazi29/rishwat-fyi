import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { Divider, IconTile } from "@/components/ui/surface";

/**
 * Figures — the system's core object. Every figure is a labelled, tabular
 * number; official figures render in ink, citizen-reported figures in red, and
 * neither is ever shown without its label (Product Principle 2). Hero and
 * gap-panel figures use the serif variant (DESIGN.md §Typography).
 */

export type FigureTone = "official" | "reported";
export type FigureSize = "sm" | "md" | "lg";

function valueSize(size: FigureSize, serif: boolean): string {
  if (size === "lg") return "text-figure-lg";
  if (size === "sm") return serif ? "text-figure" : "text-body-lg";
  return "text-figure";
}

/**
 * A single labelled figure. `note` carries provenance — an official source and
 * `last_verified`, or a "median reported" qualifier. `serif` is for hero and
 * gap statistics; the operational voice (sans) is the default.
 */
export function Figure({
  label,
  value,
  note,
  icon,
  tone = "official",
  size = "md",
  serif = false,
  className,
}: {
  label?: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  tone?: FigureTone;
  size?: FigureSize;
  serif?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label ? (
        <div className="flex items-center gap-1.5 text-label text-ink-muted">
          {icon ? (
            <span aria-hidden="true" className="text-ink-muted">
              {icon}
            </span>
          ) : null}
          <span>{label}</span>
        </div>
      ) : null}
      <div
        className={cn(
          "tabular font-semibold leading-tight",
          serif ? "font-serif" : "font-sans",
          valueSize(size, serif),
          tone === "reported" ? "text-reported" : "text-ink",
        )}
      >
        {value}
      </div>
      {note ? <div className="text-micro text-ink-muted">{note}</div> : null}
    </div>
  );
}

export interface StatItem {
  icon?: ReactNode;
  value: ReactNode;
  label: ReactNode;
}

function StatCell({ item, serif }: { item: StatItem; serif: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {item.icon ? <IconTile>{item.icon}</IconTile> : null}
      <div className="min-w-0">
        <div
          className={cn(
            "tabular font-semibold leading-none text-ink",
            serif ? "font-serif text-figure-lg" : "font-sans text-figure",
          )}
        >
          {item.value}
        </div>
        <div className="mt-1 text-label text-ink-muted">{item.label}</div>
      </div>
    </div>
  );
}

/**
 * The four-figure platform strip from the hero panel (Services tracked ·
 * Citizen reports · States covered · Reports corroborated). One row with
 * hairline seams on desktop, a 2×2 grid with hairline seams on phones.
 */
export function StatStrip({
  items,
  serif = true,
  className,
}: {
  items: StatItem[];
  serif?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* Desktop: single row, vertical hairline seams */}
      <div className="hidden items-stretch md:flex">
        {items.map((item, index) => (
          <div key={index} className="flex flex-1 items-center">
            {index > 0 ? <Divider orientation="vertical" className="mx-5" /> : null}
            <StatCell item={item} serif={serif} />
          </div>
        ))}
      </div>

      {/* Phone: 2×2 grid, hairline seams via nth-child borders */}
      <div
        className={cn(
          "grid grid-cols-2 gap-x-5 gap-y-5 md:hidden",
          "[&>*:nth-child(even)]:border-l [&>*:nth-child(even)]:border-line-inner [&>*:nth-child(even)]:pl-5",
          "[&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-line-inner [&>*:nth-child(n+3)]:pt-5",
        )}
      >
        {items.map((item, index) => (
          <StatCell key={index} item={item} serif={serif} />
        ))}
      </div>
    </div>
  );
}

/**
 * A gap-panel delta row: `+ ₹2,000` / `+ 14 days` / `+ 1.8 visits` in reported
 * red, with a plain-language qualifier beneath (DESIGN.md §Components: gap
 * panel). Feed `value` from the `formatInrDelta` / `formatDaysDelta` helpers.
 */
export function DeltaFigure({
  icon,
  label,
  value,
  qualifier,
  className,
}: {
  icon?: ReactNode;
  label?: ReactNode;
  value: ReactNode;
  qualifier?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {icon ? <IconTile>{icon}</IconTile> : null}
      <div className="min-w-0">
        {label ? <div className="text-label text-ink-secondary">{label}</div> : null}
        <div className="tabular text-figure font-semibold text-reported">{value}</div>
        {qualifier ? <div className="text-label text-ink-muted">{qualifier}</div> : null}
      </div>
    </div>
  );
}
