import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface DocTableColumn {
  /** Key into each row object. */
  key: string;
  header: string;
  align?: "left" | "right";
  /** Marks the column used as the title in the stacked phone layout. */
  primary?: boolean;
}

export type DocTableRow = Record<string, ReactNode>;

/**
 * A compact reference table for Read pages (rate limits, error codes, roles,
 * conventions). It renders a bordered table at ≥768px and a stacked
 * definition layout below, inside a single bordered surface — so it never
 * scrolls horizontally on a phone and never nests a card in a card
 * (DESIGN.md §Layout, §Don't). For numeric comparison data use the shared
 * TableShell instead.
 */
export function DocTable({
  columns,
  rows,
  caption,
  className,
}: {
  columns: DocTableColumn[];
  rows: DocTableRow[];
  caption?: string;
  className?: string;
}) {
  const primaryCol = columns.find((column) => column.primary) ?? columns[0];

  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      {/* Desktop: a real table */}
      <table className="hidden w-full border-collapse text-left md:table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-sunken">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-label font-medium text-ink-muted",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-line-inner align-top">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-body text-ink-secondary",
                    column.align === "right" && "tabular text-right",
                  )}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phone: stacked definition blocks separated by hairlines */}
      <ul className="divide-y divide-line-inner md:hidden">
        {rows.map((row, rowIndex) => (
          <li key={rowIndex} className="p-4">
            {primaryCol ? (
              <p className="text-body font-medium text-ink">{row[primaryCol.key]}</p>
            ) : null}
            <dl className="mt-2 space-y-1.5">
              {columns
                .filter((column) => column.key !== primaryCol?.key)
                .map((column) => (
                  <div key={column.key} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-label text-ink-muted">{column.header}</dt>
                    <dd className="text-right text-label text-ink-secondary">{row[column.key]}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
