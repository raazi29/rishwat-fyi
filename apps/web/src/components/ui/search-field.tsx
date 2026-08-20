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
        "flex items-stretch rounded-md border border-line bg-surface transition-colors duration-150",
        "hover:border-ink-muted focus-within:border-official-mid focus-within:ring-2 focus-within:ring-official-mid",
        isBar ? "h-[52px]" : "h-14",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-3.5 pr-2">
        <SearchIcon size={20} className="shrink-0 text-ink-muted" />
        <input
          type="search"
          name={queryName}
          defaultValue={defaultQuery}
          placeholder={placeholder}
          aria-label="Search services"
          autoFocus={autoFocus}
          className="h-full w-full bg-transparent text-body text-ink placeholder:text-ink-muted focus-visible:outline-none"
        />
      </div>

      {isBar ? (
        <>
          <div aria-hidden="true" className="my-2.5 w-px shrink-0 bg-line" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5">
            <MapPinIcon size={20} className="shrink-0 text-ink-muted" />
            <input
              type="text"
              name={locationName}
              defaultValue={defaultLocation}
              placeholder={locationPlaceholder}
              aria-label="Location"
              className="h-full w-full bg-transparent text-body text-ink placeholder:text-ink-muted focus-visible:outline-none"
            />
          </div>
        </>
      ) : null}

      <button
        type="submit"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-r-md bg-official font-medium text-white",
          "transition-colors duration-150 hover:bg-official-deep active:bg-official-deep",
          isBar ? "px-6 text-label" : "px-7 text-body",
        )}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
