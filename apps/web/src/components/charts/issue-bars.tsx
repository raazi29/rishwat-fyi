/**
 * IssueBars — horizontal labelled bars with right-aligned percentages, for
 * "Common issues reported" and "Top friction reported". The percentage is
 * always shown as text, so the bar (a hand-authored SVG rect) is pure
 * decoration and colour is never the only signal. Bars default to the official
 * green from the reference board; pass a tone to change the channel.
 */

import type { ReactNode } from "react";
import Link from "next/link";

import { ActionLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatPercent } from "@/lib/utils/format";

import { TONE_FILL, type Tone } from "./scale";

export interface IssueBarItem {
  label: string;
  /** Share of reports, 0–1. */
  ratio: number;
  href?: string;
  icon?: ReactNode;
}

export interface IssueBarsProps {
  title: string;
  items: IssueBarItem[];
  tone?: Tone;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function IssueBars({
  title,
  items,
  tone = "official",
  viewAllHref,
  viewAllLabel = "View all issues",
  className,
}: IssueBarsProps) {
  return (
    <section className={cn("flex flex-col", className)}>
      <h3 className="mb-3 text-h3 font-semibold text-ink">{title}</h3>
      <ul className="flex flex-col">
        {items.map((item) => {
          const width = Math.max(0, Math.min(1, item.ratio)) * 100;
          const label = item.href ? (
            <Link
              href={item.href}
              className="truncate underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-current"
            >
              {item.label}
            </Link>
          ) : (
            <span className="truncate">{item.label}</span>
          );
          return (
            <li key={item.label} className="flex items-center gap-3 py-1.5">
              {item.icon ? (
                <span aria-hidden="true" className="shrink-0 text-official-mid">
                  {item.icon}
                </span>
              ) : null}
              <span className="w-36 shrink-0 truncate text-body text-ink sm:w-44">{label}</span>
              <svg
                viewBox="0 0 100 6"
                preserveAspectRatio="none"
                className="h-2 flex-1"
                aria-hidden="true"
              >
                <rect x={0} y={0} width={100} height={6} rx={1.5} className="fill-sunken" />
                <rect x={0} y={0} width={width} height={6} rx={1.5} className={TONE_FILL[tone]} />
              </svg>
              <span className="w-10 shrink-0 text-right text-label font-semibold tabular text-ink">
                {formatPercent(item.ratio)}
              </span>
            </li>
          );
        })}
      </ul>
      {viewAllHref ? (
        <ActionLink href={viewAllHref} className="mt-3">
          {viewAllLabel}
        </ActionLink>
      ) : null}
    </section>
  );
}
