"use client";

import { cn } from "@/lib/utils/cn";
import { MapPinIcon, SearchIcon } from "@/components/icons";

/**
 * The search composite from the boards: a leading SearchIcon, the query input,
 * and an attached green Search button. `size="hero"` is the single wide field
 * on the home hero; `size="bar"` splits into a query segment and a location
 * segment joined by a hairline (the search-results header).
 *
 * It is a real `<form method="get">` so it works without JavaScript and never
 * fetches on the client for primary content (PRODUCT.md). The client boundary
 * only lets a parent pass default values and handlers.
 */
export function SearchField({
  size = "hero",
  action = "/search",
  defaultQuery = "",
  defaultLocation = "",
  queryName = "q",
  locationName = "location",
  queryPlaceholder,
  locationPlaceholder = "City, district or state",
  buttonLabel = "Search",
  autoFocus = false,
  className,
}: {
  size?: "hero" | "bar";
  action?: string;
  defaultQuery?: string;
  defaultLocation?: string;
  queryName?: string;
  locationName?: string;
  queryPlaceholder?: string;
  locationPlaceholder?: string;
  buttonLabel?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const isBar = size === "bar";
  const placeholder =
    queryPlaceholder ?? (isBar ? "Service or department" : "Search a service, department or location…");

  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label="Search government services"
      className={cn(
        "flex rounded-3xl border border-line bg-surface transition-all duration-200 sm:rounded-full",
        "hover:border-ink/30 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] focus-within:border-official-mid focus-within:ring-2 focus-within:ring-official-mid",
        // The two-segment bar cannot hold a query, a location and a button on a
        // 360px screen, so below `sm` it stacks and the segments are divided by
        // a horizontal hairline instead of a vertical one.
        isBar
          ? "flex-col items-stretch sm:h-[52px] sm:flex-row sm:items-stretch"
          : "h-13 items-stretch sm:h-14",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-3.5 pr-2 sm:py-0">
        <SearchIcon size={20} className="shrink-0 text-ink-muted" />
        <input
          type="search"
          name={queryName}
          defaultValue={defaultQuery}
          placeholder={placeholder}
          aria-label="Search services"
          autoFocus={autoFocus}
          className="h-11 w-full min-w-0 bg-transparent text-body text-ink placeholder:text-ink-muted focus-visible:outline-none sm:h-full"
        />
      </div>

      {isBar ? (
        <>
          <div
            aria-hidden="true"
            className="mx-3.5 h-px shrink-0 bg-line sm:mx-0 sm:my-2.5 sm:h-auto sm:w-px"
          />
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5 py-2 sm:py-0">
            <MapPinIcon size={20} className="shrink-0 text-ink-muted" />
            <input
              type="text"
              name={locationName}
              defaultValue={defaultLocation}
              placeholder={locationPlaceholder}
              aria-label="Location"
              className="h-11 w-full min-w-0 bg-transparent text-body text-ink placeholder:text-ink-muted focus-visible:outline-none sm:h-full"
            />
          </div>
        </>
      ) : null}

      <button
        type="submit"
        className={cn(
          // `text-paper` rather than `text-white`: `ink` is a near-white in dark
          // mode, where a white label would vanish.
          "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-paper",
          "m-1.5 transition-all duration-200 ease-out hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-[0.98]",
          isBar ? "px-5 text-label" : "px-5 text-label sm:px-6 sm:text-body",
        )}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
