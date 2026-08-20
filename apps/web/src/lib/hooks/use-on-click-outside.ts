"use client";

import { useEffect, type RefObject } from "react";

/**
 * Call `handler` when a pointer event lands outside the referenced element.
 *
 * Powers the header's Explore/Data dropdowns and the mobile filter sheet
 * (DESIGN.md §Components: dropdowns close on Escape/outside click). Listens on
 * `pointerdown` so the dismissal fires before a click on another trigger, and
 * skips while `enabled` is false so closed menus carry no global listeners.
 *
 * @param ref - the element whose interior clicks are considered "inside".
 * @param handler - invoked for outside clicks (and, unless disabled, Escape).
 * @param enabled - attach listeners only while true (e.g. while the menu is open).
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: PointerEvent | KeyboardEvent) => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (!node || node.contains(event.target as Node)) return;
      handler(event);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handler(event);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, handler, enabled]);
}
