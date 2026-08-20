import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/icons";

export interface Crumb {
  label: ReactNode;
  href?: string;
}

/**
 * Breadcrumb trail from the service-detail board ("Home › RTO / Transport ›
 * Driving Licence › Varanasi, Uttar Pradesh"). Ordered-list semantics; the last
 * crumb is the current page and is never a link. Separators are decorative.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-label text-ink-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors duration-150 hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-ink-secondary" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRightIcon size={14} className="shrink-0 text-ink-muted" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
