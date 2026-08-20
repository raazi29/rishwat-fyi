"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query.
 *
 * SSR-safe: returns `false` on the server and on the first client render (so
 * markup matches), then reconciles to the real match after mount. Never reads
 * `window` during render. Used to switch structural layouts — e.g. the header
 * dropdowns vs. the mobile sheet at 1024px, the comparison table vs. its card
 * mode at 900px — never to swap type sizes (DESIGN.md §Layout: responsive
 * behaviour is structural, not fluid).
 *
 * @param query - a media query string, e.g. `"(min-width: 1024px)"`.
 * @returns whether the query currently matches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
