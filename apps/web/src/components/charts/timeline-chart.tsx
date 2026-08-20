/**
 * TimelineChart — hand-authored SVG dual-series line chart: the flat official
 * baseline (`--color-official-soft`) against the reported curve
 * (`--color-reported-bar`), with dots at each point, y ticks, x-axis day ticks,
 * and optional median markers beneath the axis. The numbers live in a
 * visually-hidden table so the trend reads without colour.
 */

import { ChartFrame, type ChartLegendItem } from "./chart-frame";
import { linearAxis, TONE_FILL, TONE_STROKE, type Tone } from "./scale";

export interface TimelinePoint {
  label: string;
  official?: number;
  reported: number;
}

export interface TimelineMarker {
  /** Index into `points` (may be fractional to sit between ticks). */
  at: number;
  tone: Tone;
  label?: string;
}

export interface TimelineChartProps {
  title: string;
  subtitle?: string;
  points: TimelinePoint[];
  officialLabel?: string;
  reportedLabel?: string;
  median?: string;
  xLabel?: string;
  markers?: TimelineMarker[];
  className?: string;
}

const VB_W = 340;
const VB_H = 210;
const PAD = { l: 30, r: 10, t: 10, b: 32 };
const PLOT_W = VB_W - PAD.l - PAD.r;
const PLOT_H = VB_H - PAD.t - PAD.b;

export function TimelineChart({
  title,
  subtitle,
  points,
  officialLabel = "Official",
  reportedLabel = "Reported",
  median,
  xLabel,
  markers = [],
  className,
}: TimelineChartProps) {
  const hasOfficial = points.some((p) => typeof p.official === "number");
  let rawMax = 0;
  for (const p of points) {
    rawMax = Math.max(rawMax, p.reported);
    if (typeof p.official === "number") rawMax = Math.max(rawMax, p.official);
  }
  const axis = linearAxis(rawMax);
  const band = points.length > 0 ? PLOT_W / points.length : PLOT_W;
  const xOf = (index: number) => PAD.l + band * (index + 0.5);
  const yOf = (value: number) => PAD.t + PLOT_H - (value / axis.max) * PLOT_H;
  const baseline = PAD.t + PLOT_H;

  const line = (accessor: (p: TimelinePoint) => number | undefined) =>
    points
      .map((p, i) => [accessor(p), i] as const)
      .filter((entry): entry is readonly [number, number] => typeof entry[0] === "number")
      .map(([value, i]) => `${xOf(i).toFixed(1)},${yOf(value).toFixed(1)}`)
      .join(" ");

  const legend: ChartLegendItem[] = [{ label: reportedLabel, tone: "reported" }];
  if (hasOfficial) legend.unshift({ label: officialLabel, tone: "official" });

  const table = (
    <table className="sr-only">
      <caption>{title}</caption>
      <thead>
        <tr>
          <th scope="col">Point</th>
          {hasOfficial ? <th scope="col">{officialLabel}</th> : null}
          <th scope="col">{reportedLabel}</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.label}>
            <td>{p.label}</td>
            {hasOfficial ? <td>{p.official ?? "—"}</td> : null}
            <td>{p.reported}</td>
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
      legend={legend}
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

        {hasOfficial ? (
          <polyline
            points={line((p) => p.official)}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
            className={TONE_STROKE.official}
          />
        ) : null}
        <polyline
          points={line((p) => p.reported)}
          fill="none"
          strokeWidth={1.75}
          vectorEffect="non-scaling-stroke"
          className={TONE_STROKE.reported}
        />

        {points.map((p, i) => (
          <g key={p.label}>
            {typeof p.official === "number" ? (
              <circle cx={xOf(i)} cy={yOf(p.official)} r={1.8} className={TONE_FILL.official} />
            ) : null}
            <circle cx={xOf(i)} cy={yOf(p.reported)} r={2} className={TONE_FILL.reported} />
            <text x={xOf(i)} y={baseline + 10} textAnchor="middle" fontSize={7} className="fill-ink-muted">
              {p.label}
            </text>
          </g>
        ))}

        {markers.map((marker, index) => {
          const x = xOf(marker.at);
          return (
            <polygon
              key={`${marker.tone}-${index}`}
              points={`${x - 2.4},${baseline + 5} ${x + 2.4},${baseline + 5} ${x},${baseline + 1.5}`}
              className={TONE_FILL[marker.tone]}
            />
          );
        })}

        <line x1={PAD.l} y1={baseline} x2={PAD.l + PLOT_W} y2={baseline} className="stroke-line" strokeWidth={0.75} />
        {xLabel ? (
          <text x={PAD.l + PLOT_W / 2} y={VB_H - 1} textAnchor="middle" fontSize={7.5} className="fill-ink-muted">
            {xLabel}
          </text>
        ) : null}
      </svg>
    </ChartFrame>
  );
}
