"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface TabItem {
  value: string;
  label: ReactNode;
}

/**
 * The underline tab bar under the service-detail header (Overview · Reports ·
 * Trends · Documents · About the process). Tabs are links that set `?tab=` so
 * the server re-renders the panel and the bar works without JavaScript;
 * keyboard users get roving arrow-key focus with manual activation, per the
 * ARIA tabs pattern. Sticks under the sticky header.
 */
export function Tabs({
  items,
  paramName = "tab",
  defaultValue,
  ariaLabel = "Sections",
  className,
  stickyClassName = "sticky top-16 z-20",
}: {
  items: TabItem[];
  paramName?: string;
  defaultValue?: string;
  ariaLabel?: string;
  className?: string;
  stickyClassName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const fallback = defaultValue ?? items[0]?.value ?? "";
  const current = searchParams.get(paramName) ?? fallback;
  const currentIndex = Math.max(
    0,
    items.findIndex((item) => item.value === current),
  );
  const [focusIndex, setFocusIndex] = useState(currentIndex);

  function hrefFor(value: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    return `${pathname}?${params.toString()}`;
  }

  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    const last = items.length - 1;
    let next = focusIndex;
    if (event.key === "ArrowRight") next = focusIndex >= last ? 0 : focusIndex + 1;
    else if (event.key === "ArrowLeft") next = focusIndex <= 0 ? last : focusIndex - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    setFocusIndex(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={cn(stickyClassName, "border-b border-line bg-paper", className)}>
      <div role="tablist" aria-label={ariaLabel} className="-mb-px flex gap-6 overflow-x-auto">
        {items.map((item, index) => {
          const selected = item.value === current;
          return (
            <Link
              key={item.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              href={hrefFor(item.value)}
              scroll={false}
              role="tab"
              aria-selected={selected}
              tabIndex={index === focusIndex ? 0 : -1}
              onKeyDown={onKeyDown}
              onClick={() => setFocusIndex(index)}
              className={cn(
                "shrink-0 border-b-2 py-3 text-label font-medium transition-colors duration-150",
                selected
                  ? "border-official text-ink"
                  : "border-transparent text-ink-secondary hover:border-line hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
