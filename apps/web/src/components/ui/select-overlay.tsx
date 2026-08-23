"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { CloseIcon } from "@/components/icons";
import { useLockedBody } from "@/lib/hooks/use-locked-body";
import { useOnClickOutside } from "@/lib/hooks/use-on-click-outside";

/**
 * The single adaptive overlay behind CustomSelect and Combobox. One code path,
 * two presentations chosen by the caller's media query:
 *
 * - **Desktop** — an anchored popover directly beneath the trigger. Overlays
 *   are the one surface that leaves the page, so they carry a real shadow and
 *   *drop* the border (DESIGN.md §Elevation: "no border on a shadowed overlay").
 *   Sits at `z-30`, beneath the sticky header (`z-40`), never over it.
 * - **Mobile (≤639px)** — a fixed bottom sheet with a backdrop, a drag-handle
 *   affordance, a large title, and a labelled close button.
 *
 * The overlay owns dismissal and body state: outside pointer, Escape, and route
 * change all close it; body scroll locks only while the sheet is open; and
 * focus returns to the trigger on close unless the user has already moved it
 * elsewhere. The parent owns what goes inside (a list, or a search field plus a
 * list) and moves focus into the overlay on open.
 */

/** Below this width the overlay becomes a bottom sheet. 639px = just under the
 * Tailwind `sm` (640px) breakpoint. */
export const SHEET_MEDIA_QUERY = "(max-width: 639px)";

export interface SelectOverlayProps {
  open: boolean;
  /** True when the viewport is at sheet width. Owned by the parent (always
   * mounted) so the correct presentation is known before the overlay appears. */
  sheet: boolean;
  onClose: () => void;
  /** The trigger; treated as "inside" for outside-click, and the focus target
   * restored on close. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Sheet heading and dialog accessible name. */
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SelectOverlay({
  open,
  sheet,
  onClose,
  triggerRef,
  title,
  children,
  className,
}: SelectOverlayProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useLockedBody(open && sheet);

  // Outside pointer closes; Escape closes. `useOnClickOutside` already treats
  // clicks inside the surface as inside — here we additionally treat the
  // trigger as inside so its own click handler performs the toggle (rather than
  // this closing and the trigger immediately reopening).
  useOnClickOutside(
    surfaceRef,
    (event) => {
      if (event.type === "keydown") {
        onClose();
        return;
      }
      const target = event.target as Node | null;
      if (target && triggerRef.current?.contains(target)) return;
      onClose();
    },
    open,
  );

  // Close on client-side navigation.
  const openedAtPath = useRef(pathname);
  useEffect(() => {
    if (!open) {
      openedAtPath.current = pathname;
      return;
    }
    if (pathname !== openedAtPath.current) onClose();
  }, [pathname, open, onClose]);

  // Restore focus to the trigger when the overlay closes — but only if focus
  // fell back to the body because the element it was on (a search field or the
  // listbox) was just removed. If the user moved focus to another control by
  // clicking or tabbing away, leave it there rather than yanking it back.
  useEffect(() => {
    if (!open) return;
    const opener = triggerRef.current;
    return () => {
      const active = document.activeElement;
      if (!active || active === document.body) opener?.focus();
    };
  }, [open, triggerRef]);

  if (!open) return null;

  if (sheet) {
    return (
      <div className="fixed inset-0 z-50 sm:hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-black/50 motion-safe:animate-[fade-rise_120ms_ease-out]" />
        <div
          ref={surfaceRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-lg bg-surface shadow-overlay",
            "motion-safe:animate-[fade-rise_150ms_ease-out]",
            className,
          )}
        >
          <div className="shrink-0 pt-2.5">
            <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-line" />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
            <span className="font-sans text-h3 font-semibold text-ink">{title ?? "Select"}</span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink-secondary transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              <CloseIcon size={22} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "absolute inset-x-0 top-full z-30 mt-1.5 flex max-h-[min(22rem,60vh)] flex-col overflow-hidden rounded-md bg-surface shadow-overlay",
        "motion-safe:animate-[fade-rise_120ms_ease-out]",
        className,
      )}
    >
      {children}
    </div>
  );
}
