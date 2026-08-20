"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { CloseIcon, FilterIcon } from "@/components/icons";
import { useLockedBody } from "@/lib/hooks/use-locked-body";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

/**
 * Below 1024px the filter rail collapses to a "Filters" button that opens a
 * left-hand sheet — a shadowed, borderless overlay (DESIGN.md §Elevation). The
 * open/close state is the only client state on the search page; the filter
 * controls themselves are the same server-rendered no-JS form, passed as
 * `children`. Body scroll locks while open; Escape or an outside tap closes it.
 */
export function FiltersSheet({
  activeCount = 0,
  children,
  className,
}: {
  activeCount?: number;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useLockedBody(open);
  useOnClickOutside(panelRef, () => setOpen(false), open);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previous?.focus();
  }, [open]);

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-label font-medium text-ink transition-colors duration-150 hover:bg-sunken active:bg-sunken"
      >
        <FilterIcon size={18} className="text-ink-muted" />
        Filters
        {activeCount > 0 ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-official px-1.5 text-micro font-semibold text-white tabular">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-ink/40" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Refine your search"
            tabIndex={-1}
            className={cn(
              "absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-paper shadow-overlay outline-none",
            )}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-sans text-h3 font-semibold text-ink">Filters</span>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
                className="inline-flex size-11 items-center justify-center rounded-md text-ink-secondary transition-colors duration-150 hover:bg-sunken hover:text-ink"
              >
                <CloseIcon size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
