import Link from "next/link";
import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils/cn";

export interface Crumb {
  label: ReactNode;
  href?: string;
}

/**
 * A compact context rail: linked ancestors remain comfortably tappable, while
 * the current page sits on a quiet sunken surface. Long paths scroll within the
 * rail on a phone instead of wrapping into a distracting multi-line block.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <ol className="flex min-w-max items-center gap-1 text-label text-ink-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex shrink-0 items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-9 items-center rounded-sm px-1.5 transition-colors duration-150 hover:bg-sunken hover:text-ink pointer-coarse:min-h-11"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-md px-2 whitespace-nowrap",
                    isLast ? "bg-sunken font-medium text-ink" : "text-ink-secondary",
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRightIcon aria-hidden="true" size={14} className="shrink-0 text-ink-muted" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
