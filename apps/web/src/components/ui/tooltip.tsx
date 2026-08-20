"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * An accessible tooltip for the choropleth states, figure qualifiers, and
 * truncated labels. It renders through a portal with `position: fixed`, so it
 * escapes the `overflow: hidden` on cards and table shells (DESIGN.md
 * §Elevation: overlays are shadowed, borderless). Opens on hover, focus, and
 * tap; closes on blur, leave, and Escape.
 */
export function Tooltip({
  content,
  placement = "top",
  focusable = true,
  className,
  children,
}: {
  content: ReactNode;
  placement?: "top" | "bottom";
  /** Set false when wrapping an already-focusable element to avoid a double tab stop. */
  focusable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => setMounted(true), []);

  const update = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: placement === "bottom" ? rect.bottom : rect.top,
      left: rect.left + rect.width / 2,
    });
  };

  const show = () => {
    update();
    setOpen(true);
  };
  const hide = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({
        top: placement === "bottom" ? rect.bottom : rect.top,
        left: rect.left + rect.width / 2,
      });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, placement]);

  return (
    <>
      <span
        ref={ref}
        tabIndex={focusable ? 0 : undefined}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape") hide();
        }}
        className={cn("inline-flex", className)}
      >
        {children}
      </span>
      {mounted && open
        ? createPortal(
            <div
              role="tooltip"
              id={id}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform:
                  placement === "bottom"
                    ? "translate(-50%, 8px)"
                    : "translate(-50%, calc(-100% - 8px))",
              }}
              className="pointer-events-none z-50 max-w-xs rounded-md bg-ink px-2.5 py-1.5 text-label text-ink-inverse shadow-overlay"
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
