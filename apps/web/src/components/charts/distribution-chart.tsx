/**
 * DistributionChart — hand-authored SVG vertical bars for a reported
 * distribution (e.g. timeline buckets, additional-amount buckets). Supports an
 * optional second series overlaid behind the primary one: official series in
 * `--color-official-soft`, reported series in `--color-reported-bar`
 * (see next_section.png). Axis, y ticks and x labels are always present; the
 * SVG is decorative and the numbers live in a visually-hidden table.
 */

import { ChartFrame, type ChartLegendItem } from "./chart-frame";
import { linearAxis, TONE_FILL } from "./scale";

export interface DistributionBucket {
  label: string;
  official?: number;
  reported?: number;
}

export interface DistributionChartProps {
  title: string;
  subtitle?: string;
  buckets: DistributionBucket[];
  /** Front series and single-series default colour. */
  primary?: "official" | "reported";
  median?: string;
  xLabel?: string;
  officialLabel?: string;
  reportedLabel?: string;
  className?: string;
}

const VB_W = 340;
const VB_H = 210;
const PAD = { l: 30, r: 8, t: 10, b: 30 };
const PLOT_W = VB_W - PAD.l - PAD.r;
const PLOT_H = VB_H - PAD.t - PAD.b;

export function DistributionChart({
  title,
  subtitle,
  buckets,
  primary = "reported",
  median,
  xLabel,
  officialLabel = "Official",
  reportedLabel = "Reported",
  className,
}: DistributionChartProps) {
  const hasOfficial = buckets.some((b) => typeof b.official === "number");
  const hasReported = buckets.some((b) => typeof b.reported === "number");
  const dual = hasOfficial && hasReported;

  let rawMax = 0;
  for (const b of buckets) {
    if (typeof b.official === "number") rawMax = Math.max(rawMax, b.official);
    if (typeof b.reported === "number") rawMax = Math.max(rawMax, b.reported);
  }
  const axis = linearAxis(rawMax);
  const band = buckets.length > 0 ? PLOT_W / buckets.length : PLOT_W;
  const yOf = (value: number) => PAD.t + PLOT_H - (value / axis.max) * PLOT_H;

  const legend: ChartLegendItem[] = dual
    ? [
        { label: officialLabel, tone: "official" },
        { label: reportedLabel, tone: "reported" },
      ]
    : [];

  const table = (
    <table className="sr-only">
      <caption>{title}</caption>
      <thead>
        <tr>
          <th scope="col">Range</th>
          {hasOfficial ? <th scope="col">{officialLabel}</th> : null}
          {hasReported ? <th scope="col">{reportedLabel}</th> : null}
        </tr>
      </thead>
      <tbody>
        {buckets.map((b) => (
          <tr key={b.label}>
            <td>{b.label}</td>
            {hasOfficial ? <td>{b.official ?? "—"}</td> : null}
            {hasReported ? <td>{b.reported ?? "—"}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <ChartFrame
      title={title}
      {...(subtitle ? { subtitle } : {})}
      {...(median ? { median: { value: median } } : {})}
      {...(legend.length ? { legend } : {})}
      table={table}
      className={className}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full" aria-hidden="true">
        {axis.ticks.map((tick) => {
          const y = yOf(tick);
          return (
            <g key={tick}>
              <line x1={PAD.l} y1={y} x2={PAD.l + PLOT_W} y2={y} className="stroke-line-inner" strokeWidth={0.5} />
              <text x={PAD.l - 4} y={y + 2.5} textAnchor="end" fontSize={7.5} className="fill-ink-muted tabular">
                {tick}
              </text>
            </g>
          );
        })}

        {buckets.map((b, index) => {
          const center = PAD.l + band * (index + 0.5);
          const series: { v: number; tone: "official" | "reported"; front: boolean }[] = [];
          if (typeof b.official === "number") {
            series.push({ v: b.official, tone: "official", front: primary === "official" });
          }
          if (typeof b.reported === "number") {
            series.push({ v: b.reported, tone: "reported", front: primary === "reported" });
          }
          series.sort((a, c) => Number(a.front) - Number(c.front));
          return (
            <g key={b.label}>
              {series.map((s) => {
                const w = dual ? (s.front ? band * 0.4 : band * 0.64) : band * 0.5;
                const y = yOf(s.v);
                return (
                  <rect
                    key={s.tone}
                    x={center - w / 2}
                    y={y}
                    width={w}
                    height={PAD.t + PLOT_H - y}
                    rx={1.5}
                    fillOpacity={dual && !s.front ? 0.4 : 1}
                    className={TONE_FILL[s.tone]}
                  />
                );
              })}
              <text x={center} y={PAD.t + PLOT_H + 10} textAnchor="middle" fontSize={7.5} className="fill-ink-muted">
                {b.label}
              </text>
            </g>
          );
        })}

        <line x1={PAD.l} y1={PAD.t + PLOT_H} x2={PAD.l + PLOT_W} y2={PAD.t + PLOT_H} className="stroke-line" strokeWidth={0.75} />
        {xLabel ? (
          <text x={PAD.l + PLOT_W / 2} y={VB_H - 2} textAnchor="middle" fontSize={7.5} className="fill-ink-muted">
            {xLabel}
          </text>
        ) : null}
      </svg>
    </ChartFrame>
  );
}
