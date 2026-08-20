"use client";

import { useEffect } from "react";

/**
 * Lock document scroll while `locked` is true, restoring the previous value on
 * release. Used by the mobile navigation sheet so the page behind the overlay
 * does not scroll under the reporter's thumb (DESIGN.md §Layout: the nav
 * collapses to a hamburger sheet below 1024px).
 *
 * SSR-safe: touches `document` only inside the effect, never during render.
 *
 * @param locked - whether body scrolling should be suppressed.
 */
export function useLockedBody(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, [locked]);
}
