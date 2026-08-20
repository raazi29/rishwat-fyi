import Link from "next/link";
import type {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils/cn";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Comparison-table primitives. The shell is a hairline-bordered, 12px-radius,
 * clipped container; the header is sunken and sticky with grouped two-row
 * labels (official group green, reported group red). Below 900px the table is
 * replaced by a caller-supplied card layout — tables never scroll horizontally
 * on phones (DESIGN.md §Layout). Numeric cells are tabular and right-aligned.
 */

/**
 * Wraps the `<table>` in its bordered, clipped shell for ≥900px and renders the
 * `cards` slot instead below 900px. `cards` is required so the phone layout is
 * always present rather than an accidental horizontal scroll.
 */
export function TableShell({
  cards,
  caption,
  ariaLabel,
  className,
  children,
}: {
  cards: ReactNode;
  caption?: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div
        className={cn(
          "hidden overflow-hidden rounded-lg border border-line bg-surface min-[900px]:block",
          className,
        )}
      >
        <table className="w-full border-collapse text-left" aria-label={ariaLabel}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          {children}
        </table>
      </div>
      <div className={cn("min-[900px]:hidden", className)}>{cards}</div>
    </>
  );
}

/** Sunken, sticky table header. Holds one or two `<tr>` rows of `Th`. */
export function THead({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("sticky top-0 z-10 bg-sunken text-ink-secondary", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

const TH_TONES = {
  neutral: "text-ink-muted",
  official: "text-official-mid",
  reported: "text-reported",
} as const;

/**
 * A header cell. `group` renders the OFFICIAL / CITIZEN EXPERIENCE spanning
 * labels in the reserved uppercase-tracked style with a `tone`; otherwise it is
 * a plain muted column label. `numeric` right-aligns to match the data cells.
 */
export function Th({
  group = false,
  tone = "neutral",
  numeric = false,
  scope = "col",
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  group?: boolean;
  tone?: keyof typeof TH_TONES;
  numeric?: boolean;
}) {
  return (
    <th
      scope={scope}
      className={cn(
        "px-4 py-3 align-bottom font-medium",
        group ? "column-label" : "text-label",
        TH_TONES[tone],
        numeric ? "text-right" : "text-left",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

/** A body cell with a top hairline row separator. */
export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-t border-line-inner px-4 py-4 align-middle text-body text-ink", className)}
      {...props}
    >
      {children}
    </td>
  );
}

/**
 * A numeric body cell: tabular figures, right-aligned. `tone="reported"` colours
 * the value in the citizen-reported red — the only place red appears in a table
 * (DESIGN.md §Colors rule 1).
 */
export function NumericTd({
  tone = "official",
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { tone?: "official" | "reported" | "muted" }) {
  return (
    <Td
      className={cn(
        "tabular text-right",
        tone === "reported" && "text-reported",
        tone === "muted" && "text-ink-muted",
        className,
      )}
      {...props}
    >
      {children}
    </Td>
  );
}

/**
 * The trailing arrow cell that links a row to its service page. The link is a
 * 44px target; give it a descriptive `label` since the arrow alone is silent.
 */
export function RowLink({
  href,
  label = "View details",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Td className={cn("w-12 text-right", className)}>
      <Link
        href={href}
        aria-label={label}
        className="inline-flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-official-mid active:bg-sunken"
      >
        <ArrowRightIcon size={18} />
      </Link>
    </Td>
  );
}
