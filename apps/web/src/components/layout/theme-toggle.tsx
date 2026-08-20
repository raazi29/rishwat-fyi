"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";
import { MoonIcon, SunIcon } from "@/components/icons";

type Theme = "light" | "dark";

/**
 * The header's light/dark toggle. Sets `data-theme` on <html>, persists the
 * choice to the `theme` localStorage key, and on a first visit reflects the
 * value already applied by ThemeScript (which honoured prefers-color-scheme).
 * Dark exists because the reporter is often on a phone at night (DESIGN.md).
 *
 * Before mount `theme` is null and the light-state icon renders on both server
 * and client, so hydration matches; the real state is reconciled after mount.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    }
  }, []);

  const isDark = theme === "dark";

  const apply = (next: Theme) => {
    setTheme(next);
    if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* Private mode: the in-session toggle still works. */
    }
  };

  return (
    <button
      type="button"
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => apply(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface text-ink-secondary transition-colors duration-150 hover:bg-sunken hover:text-ink active:bg-sunken",
        className,
      )}
    >
      {isDark ? <MoonIcon size={20} /> : <SunIcon size={20} />}
    </button>
  );
}
