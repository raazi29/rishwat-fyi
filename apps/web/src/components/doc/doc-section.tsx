import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * A titled article section: a hairline rule above it (except the first), a serif
 * h2 in the record's voice, an optional lead paragraph at the reading measure,
 * then the body. The `id` anchors the in-page table of contents and gives the
 * heading a scroll margin clear of the sticky header (DESIGN.md §Layout).
 */
export function DocSection({
  id,
  title,
  lead,
  className,
  children,
}: {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "mt-12 border-t border-line-inner pt-10 first:mt-0 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <h2 id={id} className="scroll-mt-24 font-serif text-h2 font-bold text-ink">
        {title}
      </h2>
      {lead ? (
        <p className="prose-measure mt-3 text-body-lg text-ink-secondary">{lead}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
