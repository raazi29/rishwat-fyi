"use client";

/**
 * MapTooltip — the only client island in the map system. It attaches delegated
 * pointer + focus listeners to a choropleth container (by id) and shows a card
 * for the state under the cursor or keyboard focus. It uses `position: fixed`
 * so it escapes the panel's overflow and never clips at a card edge.
 *
 * The choropleth itself is server-rendered inline SVG; this only decorates it.
 * With JavaScript off, every state is still a focusable link with an accessible
 * name and the full data table renders — the tooltip is pure enhancement.
 */

import { useEffect, useState } from "react";

interface TooltipState {
  name: string;
  value: string;
  x: number;
  y: number;
}

const OFFSET = 14;
const MARGIN = 8;
const CARD_W = 176;
const CARD_H = 58;

export interface MapTooltipProps {
  /** id of the element wrapping the choropleth SVG. */
  anchorId: string;
}

export function MapTooltip({ anchorId }: MapTooltipProps) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const root = document.getElementById(anchorId);
    if (!root) return;

    const read = (el: Element, x: number, y: number) => {
      const name = el.getAttribute("data-state-name");
      if (name === null) return;
      setTip({ name, value: el.getAttribute("data-state-value") ?? "", x, y });
    };
    const target = (event: Event) =>
      (event.target as Element | null)?.closest("[data-state-code]") ?? null;

    const onOver = (event: Event) => {
      const el = target(event);
      const pointer = event as PointerEvent;
      if (el) read(el, pointer.clientX, pointer.clientY);
    };
    const onMove = (event: Event) => {
      const el = target(event);
      if (!el) return;
      const pointer = event as PointerEvent;
      setTip((prev) => (prev ? { ...prev, x: pointer.clientX, y: pointer.clientY } : prev));
    };
    const onOut = (event: Event) => {
      const el = target(event);
      const related = (event as PointerEvent).relatedTarget as Node | null;
      if (el && (!related || !el.contains(related))) setTip(null);
    };
    const onFocus = (event: Event) => {
      const el = target(event);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      read(el, rect.left + rect.width / 2, rect.top);
    };
    const clear = () => setTip(null);

    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerout", onOut);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", clear);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("blur", clear);

    return () => {
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", clear);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("blur", clear);
    };
  }, [anchorId]);

  if (!tip) return null;

  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  const left = Math.min(Math.max(MARGIN, tip.x + OFFSET), vw - CARD_W - MARGIN);
  const top = Math.min(Math.max(MARGIN, tip.y + OFFSET), vh - CARD_H - MARGIN);

  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{ position: "fixed", left, top, width: CARD_W, pointerEvents: "none" }}
      className="z-50 rounded-md bg-surface px-3 py-2 shadow-overlay"
    >
      <p className="text-label font-medium text-ink">{tip.name}</p>
      <p className="text-body font-semibold tabular text-ink">{tip.value}</p>
    </div>
  );
}
