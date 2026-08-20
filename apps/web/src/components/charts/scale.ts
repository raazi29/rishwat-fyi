/**
 * Shared chart primitives. Series colours are driven by CSS variables (via the
 * Tailwind token utilities) so the official/reported hues track dark mode.
 * Kept library-free and pure so every chart stays server-renderable.
 */

export type Tone = "official" | "reported" | "neutral";

export const TONE_FILL: Record<Tone, string> = {
  official: "fill-official-soft",
  reported: "fill-reported-bar",
  neutral: "fill-ink-muted",
};

export const TONE_STROKE: Record<Tone, string> = {
  official: "stroke-official-soft",
  reported: "stroke-reported-bar",
  neutral: "stroke-ink-muted",
};

export const TONE_BG: Record<Tone, string> = {
  official: "bg-official-soft",
  reported: "bg-reported-bar",
  neutral: "bg-ink-muted",
};

/** Round up to a readable step (1, 2, 2.5, 5, 10 × 10ⁿ). */
export function niceStep(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

export interface Axis {
  max: number;
  ticks: number[];
}

/** A y-axis with `intervals` evenly spaced, nicely-rounded ticks up from zero. */
export function linearAxis(rawMax: number, intervals = 5): Axis {
  const step = niceStep(Math.max(rawMax, 1) / intervals);
  const ticks: number[] = [];
  for (let i = 0; i <= intervals; i += 1) ticks.push(step * i);
  return { max: step * intervals, ticks };
}

/** Deterministic id from a title, for aria-labelledby without a client hook. */
export function slugId(text: string): string {
  return `chart-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}
