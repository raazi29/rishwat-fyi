import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * A labelled group section, used to group the state index by region (or, with a
 * different label, alphabetically) and the department index by category. It
 * renders a proper `<section>` with an `<h2>`-level heading tied together by
 * `aria-labelledby`, an optional count, and the caller's rows as its body.
 * Purely structural — it never becomes a nested card.
 */
export function RegionGroup({
  id,
  label,
  meta,
  description,
  headingLevel = "h2",
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  /** Right-aligned meta beside the heading, e.g. "12 states" or "3 departments". */
  meta?: ReactNode;
  description?: ReactNode;
  headingLevel?: "h2" | "h3";
  children: ReactNode;
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <section aria-labelledby={id} className={cn("mt-8 first:mt-0", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <Heading id={id} className="font-serif text-h2 font-bold text-ink">
          {label}
        </Heading>
        {meta ? <span className="shrink-0 text-label tabular text-ink-muted">{meta}</span> : null}
      </div>
      {description ? (
        <p className="mb-3 max-w-[68ch] text-body text-ink-secondary">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
