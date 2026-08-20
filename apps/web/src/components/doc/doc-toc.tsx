"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { TableOfContentsItem } from "./types";

/**
 * An in-page table of contents. It renders as a plain nested list of anchor
 * links (works with no JavaScript — the whole tree is server-rendered), and on
 * hydration an IntersectionObserver tracks which section is in view and marks
 * the matching link current. Shown in the sticky rail on ≥1024px.
 */
export function DocToc({
  items,
  title = "On this page",
  className,
}: {
  items: TableOfContentsItem[];
  title?: string;
  className?: string;
}) {
  const ids = collectIds(items);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (ids.length === 0 || typeof IntersectionObserver === "undefined") return;

    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        // The heading nearest the top of the viewport wins.
        const topmost = visible.reduce((nearest, entry) =>
          entry.boundingClientRect.top < nearest.boundingClientRect.top ? entry : nearest,
        );
        setActiveId(topmost.target.id);
      },
      { rootMargin: "-88px 0px -55% 0px", threshold: [0, 1] },
    );

    for (const heading of headings) observer.observe(heading);
    return () => observer.disconnect();
    // Re-run only when the set of tracked ids changes.
  }, [ids.join("|")]);

  if (items.length === 0) return null;

  return (
    <nav aria-label={title} className={cn("text-label", className)}>
      <p className="text-label font-semibold text-ink">{title}</p>
      <TocList items={items} activeId={activeId} className="mt-3 border-l border-line-inner" />
    </nav>
  );
}

function TocList({
  items,
  activeId,
  className,
}: {
  items: TableOfContentsItem[];
  activeId: string;
  className?: string;
}) {
  return (
    <ul className={className}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              data-active={active ? "true" : undefined}
              className={cn(
                "-ml-px block border-l border-transparent py-1.5 pl-4 transition-colors duration-150",
                "text-ink-muted hover:text-ink",
                "data-[active=true]:border-official-mid data-[active=true]:font-medium data-[active=true]:text-official-mid",
              )}
            >
              {item.label}
            </a>
            {item.children && item.children.length > 0 ? (
              <TocList items={item.children} activeId={activeId} className="ml-4" />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function collectIds(items: TableOfContentsItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    ids.push(item.id);
    if (item.children) ids.push(...collectIds(item.children));
  }
  return ids;
}
