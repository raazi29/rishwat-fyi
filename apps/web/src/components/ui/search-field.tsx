"use client";

import { cn } from "@/lib/utils/cn";
import { MapPinIcon, SearchIcon } from "@/components/icons";

/**
 * The search composite from the boards: a leading SearchIcon, the query input,
 * and an attached official-green Search button. `size="hero"` is the single
 * wide field on the home hero; `size="bar"` splits into query and location.
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
        "flex rounded-2xl border border-line/80 bg-surface transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.03),0_0px_0px_1px_rgba(0,0,0,0.02)]",
        "hover:border-official-mid/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)]",
        "focus-within:border-official-mid/60 focus-within:shadow-[0_0px_0px_3px_rgba(15,61,38,0.08)]",
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
          "m-1 inline-flex min-h-11 shrink-0 items-center justify-center rounded-[10px] font-semibold text-ink-inverse",
          "bg-gradient-to-b from-[color-mix(in_srgb,var(--color-official)_100%,white_8%)] to-official",
          "shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0px_0px_1px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.12)]",
          "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "hover:from-[color-mix(in_srgb,var(--color-official)_100%,white_12%)] hover:to-official-deep hover:shadow-[0_3px_8px_-2px_rgba(0,0,0,0.25),0_0px_0px_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.14)]",
          "active:translate-y-[1px] active:shadow-[0_0px_1px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(0,0,0,0.1)]",
          isBar ? "px-5 text-[13.5px]" : "px-5 text-[13.5px] sm:px-6 sm:text-[15px]",
        )}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
