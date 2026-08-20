import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

/**
 * Pagination and result-count line for list surfaces (search, states, admin
 * queue). Server-rendered next/link navigation that preserves every existing
 * query parameter and only changes the page. Matches the search board's
 * "Showing 1 to 6 of 6 results" footer with `‹ 1 ›`.
 */

type QueryValue = string | string[] | undefined;

function buildPageList(current: number, total: number, sibling: number): Array<number | "gap"> {
  const pages = new Set<number>([1, total]);
  for (let i = current - sibling; i <= current + sibling; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) out.push("gap");
    out.push(page);
    previous = page;
  }
  return out;
}

const CELL =
  "inline-flex size-11 items-center justify-center rounded-md text-label font-medium transition-colors duration-150";

export function Pagination({
  page,
  totalPages,
  pathname,
  searchParams = {},
  pageParam = "page",
  siblingCount = 1,
  className,
}: {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams?: Record<string, QueryValue>;
  pageParam?: string;
  siblingCount?: number;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === pageParam || value === undefined) continue;
      if (Array.isArray(value)) for (const entry of value) params.append(key, entry);
      else params.set(key, value);
    }
    if (target > 1) params.set(pageParam, String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const items = buildPageList(page, totalPages, siblingCount);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      {atStart ? (
        <span aria-disabled="true" className={cn(CELL, "border border-line text-ink-muted opacity-55")}>
          <ChevronLeftIcon size={18} />
        </span>
      ) : (
        <Link href={hrefFor(page - 1)} rel="prev" aria-label="Previous page" className={cn(CELL, "border border-line text-ink-secondary hover:bg-sunken hover:text-ink")}>
          <ChevronLeftIcon size={18} />
        </Link>
      )}

      {items.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden="true" className="inline-flex size-11 items-center justify-center text-ink-muted">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={cn(CELL, "border border-official font-semibold text-official")}>
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} aria-label={`Page ${item}`} className={cn(CELL, "text-ink-secondary hover:bg-sunken hover:text-ink")}>
            {item}
          </Link>
        ),
      )}

      {atEnd ? (
        <span aria-disabled="true" className={cn(CELL, "border border-line text-ink-muted opacity-55")}>
          <ChevronRightIcon size={18} />
        </span>
      ) : (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Next page" className={cn(CELL, "border border-line text-ink-secondary hover:bg-sunken hover:text-ink")}>
          <ChevronRightIcon size={18} />
        </Link>
      )}
    </nav>
  );
}

/**
 * "Showing 1 to 20 of 284 results". Renders a plain, screen-reader-friendly
 * summary; when `total` is 0 it says so rather than showing an empty range.
 */
export function ResultCount({
  page,
  perPage,
  total,
  unit = "result",
  className,
}: {
  page: number;
  perPage: number;
  total: number;
  unit?: string;
  className?: string;
}) {
  const plural = total === 1 ? unit : `${unit}s`;
  if (total <= 0) {
    return <p className={cn("text-label text-ink-muted", className)}>No {unit}s found</p>;
  }
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <p className={cn("text-label text-ink-secondary", className)}>
      Showing <span className="tabular">{from}</span> to <span className="tabular">{to}</span> of{" "}
      <span className="tabular font-medium text-ink">{total}</span> {plural}
    </p>
  );
}
