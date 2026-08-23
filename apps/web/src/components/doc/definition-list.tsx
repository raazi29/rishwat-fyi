import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface DefinitionFact {
  label: string;
  value: ReactNode;
}

export interface DefinitionItem {
  /** Anchor id for deep links (optional). */
  id?: string;
  /** The term — typically a dataset column name, rendered in mono. */
  term: string;
  /** Small labelled facts shown as a chip row: type, unit, nullable, exported. */
  facts?: DefinitionFact[];
  description: ReactNode;
}

/**
 * A scannable definition list for the data dictionary: each entry is a mono
 * term, an optional row of labelled facts (type · unit · nullable · exported),
 * and a description, separated by inner hairlines inside one bordered surface.
 * Responsive by construction — it stacks and never scrolls sideways.
 */
export function DefinitionList({
  items,
  className,
}: {
  items: DefinitionItem[];
  className?: string;
}) {
  return (
    <dl className={cn("overflow-hidden rounded-lg border border-line bg-surface", className)}>
      {items.map((item, index) => (
        <div
          key={item.term}
          id={item.id}
          className={cn("scroll-mt-24 p-5", index > 0 && "border-t border-line-inner")}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            {/* min-w-0 lets a long column name shrink in the flex row so
                overflow-wrap can break it instead of overflowing at 360px */}
            <dt className="min-w-0 break-words font-mono text-body font-medium text-ink">{item.term}</dt>
            {item.facts && item.facts.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {item.facts.map((fact) => (
                  <span
                    key={fact.label}
                    className="inline-flex items-center gap-1 rounded-sm bg-sunken px-2 py-0.5 text-micro"
                  >
                    <span className="text-ink-muted">{fact.label}</span>
                    <span className="font-medium text-ink">{fact.value}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <dd className="mt-2 break-words text-body text-ink-secondary">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
