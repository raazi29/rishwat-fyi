/**
 * MiniBars — a compact bar cluster for dense panels. Per the design rules it is
 * allowed ONLY when it carries a value label and an axis, never as decoration:
 * every bar shows its value and sits on a baseline, and a required accessible
 * name plus a visually-hidden table make the numbers available without colour.
 */

import { cn } from "@/lib/utils/cn";

import { TONE_FILL, type Tone } from "./scale";

export interface MiniBarItem {
  label: string;
  value: number;
}

export interface MiniBarsProps {
  data: MiniBarItem[];
  /** Required: the chart's accessible name (table caption). */
  ariaLabel: string;
  tone?: Tone;
  valueFormat?: (value: number) => string;
  className?: string;
}

const VB_W = 220;
const VB_H = 96;
const PAD = { l: 6, r: 6, t: 14, b: 16 };
const PLOT_W = VB_W - PAD.l - PAD.r;
const PLOT_H = VB_H - PAD.t - PAD.b;

export function MiniBars({
  data,
  ariaLabel,
  tone = "neutral",
  valueFormat = (value) => String(value),
  className,
}: MiniBarsProps) {
  const max = data.reduce((acc, item) => Math.max(acc, item.value), 0) || 1;
  const band = data.length > 0 ? PLOT_W / data.length : PLOT_W;
  const baseline = PAD.t + PLOT_H;

  return (
    <figure className={cn("flex flex-col", className)}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full" aria-hidden="true">
        {data.map((item, index) => {
          const center = PAD.l + band * (index + 0.5);
          const width = band * 0.58;
          const height = (item.value / max) * PLOT_H;
          const top = baseline - height;
          return (
            <g key={item.label}>
              <rect x={center - width / 2} y={top} width={width} height={height} rx={1.5} className={TONE_FILL[tone]} />
              <text x={center} y={top - 2.5} textAnchor="middle" fontSize={7} className="fill-ink font-semibold tabular">
                {valueFormat(item.value)}
              </text>
              <text x={center} y={baseline + 9} textAnchor="middle" fontSize={6.5} className="fill-ink-muted">
                {item.label}
              </text>
            </g>
          );
        })}
        <line x1={PAD.l} y1={baseline} x2={PAD.l + PLOT_W} y2={baseline} className="stroke-line" strokeWidth={0.75} />
      </svg>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.label}>
              <td>{item.label}</td>
              <td>{valueFormat(item.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
