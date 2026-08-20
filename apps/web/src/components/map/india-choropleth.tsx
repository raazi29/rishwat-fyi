/**
 * IndiaChoropleth — pre-projected inline SVG map, fully server-rendered.
 *
 * Values are keyed by ISO 3166-2:IN state code and sorted into five threshold
 * bins painted with `--color-ramp-1…5` (the gap ramp in DESIGN.md). Every state
 * is a focusable link (or focusable region) whose accessible name is
 * "State — ₹value", and a visually-hidden table lists every state and value so
 * the data is readable without seeing colour. Colour is never the only signal:
 * the neighbouring list and the table carry the same numbers.
 *
 * The geometry comes from `src/data/india-states.ts` (see scripts/build-india-map.mjs).
 */

import { INDIA_STATES, INDIA_VIEWBOX } from "@/data/india-states";
import { cn } from "@/lib/utils/cn";
import { formatInr } from "@/lib/utils/format";

import { MapTooltip } from "./map-tooltip";

export type ChoroplethVariant = "panel" | "full";

/** Four ascending breakpoints → five bins. */
export type GapThresholds = [number, number, number, number];

export interface IndiaChoroplethProps {
  /** Gap value in rupees keyed by state code; absent/`null` renders as "no data". */
  values: Record<string, number | null>;
  /** Explicit bin breakpoints; computed from the data (quintiles) when omitted. */
  thresholds?: GapThresholds;
  /** Link target per state, e.g. `(code) => \`/states/${code}\``. */
  hrefForState?: (code: string, name: string) => string | undefined;
  /** Render a value for the accessible name and tooltip. Defaults to ₹ formatting. */
  formatValue?: (value: number | null) => string;
  variant?: ChoroplethVariant;
  /** Attach the hover/focus tooltip island. Default true. */
  interactive?: boolean;
  /** Unique id; required when more than one choropleth is on a page. */
  id?: string;
  /** Accessible name for the figure and hidden table caption. */
  caption?: string;
  className?: string;
}

const RAMP_FILL = ["fill-ramp-1", "fill-ramp-2", "fill-ramp-3", "fill-ramp-4", "fill-ramp-5"];

const VARIANT_MAX: Record<ChoroplethVariant, string> = {
  panel: "max-w-sm",
  full: "max-w-2xl",
};

function quintiles(values: number[]): GapThresholds {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number): number => {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
    return sorted[index] ?? 0;
  };
  return [at(0.2), at(0.4), at(0.6), at(0.8)];
}

function binOf(value: number, thresholds: GapThresholds): number {
  if (value <= thresholds[0]) return 0;
  if (value <= thresholds[1]) return 1;
  if (value <= thresholds[2]) return 2;
  if (value <= thresholds[3]) return 3;
  return 4;
}

const defaultFormat = (value: number | null): string =>
  value === null ? "No data" : formatInr(value);

export function IndiaChoropleth({
  values,
  thresholds,
  hrefForState,
  formatValue = defaultFormat,
  variant = "panel",
  interactive = true,
  id = "india-choropleth",
  caption = "Reported gap by state",
  className,
}: IndiaChoroplethProps) {
  const present = INDIA_STATES.map((s) => values[s.code]).filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v),
  );
  const bins = thresholds ?? quintiles(present);

  const rows = INDIA_STATES.map((state) => {
    const raw = values[state.code];
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    const display = formatValue(value);
    const fill = value === null ? "fill-sunken" : (RAMP_FILL[binOf(value, bins)] ?? "fill-sunken");
    const href = hrefForState?.(state.code, state.name);
    return { state, value, display, fill, href };
  });

  return (
    <figure className={cn("mx-auto w-full", VARIANT_MAX[variant], className)}>
      <div id={id} className="relative">
        <svg
          viewBox={INDIA_VIEWBOX}
          className="block h-auto w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {rows.map(({ state, display, fill, href }) => {
            const label = `${state.name} — ${display}`;
            const shape = (
              <path
                d={state.d}
                fillRule="evenodd"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
                className={cn(
                  "stroke-surface transition-[fill,stroke] duration-150",
                  fill,
                  "group-hover:stroke-ink group-focus-visible:stroke-ink",
                )}
              />
            );
            if (href) {
              return (
                <a
                  key={state.code}
                  href={href}
                  aria-label={label}
                  className="group"
                  data-state-code={state.code}
                  data-state-name={state.name}
                  data-state-value={display}
                >
                  {shape}
                </a>
              );
            }
            return (
              <g
                key={state.code}
                role="img"
                aria-label={label}
                tabIndex={0}
                className="group"
                data-state-code={state.code}
                data-state-name={state.name}
                data-state-value={display}
              >
                {shape}
              </g>
            );
          })}
        </svg>
        {interactive ? <MapTooltip anchorId={id} /> : null}
      </div>

      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Reported gap</th>
          </tr>
        </thead>
        <tbody>
          {[...rows]
            .sort((a, b) => a.state.name.localeCompare(b.state.name))
            .map(({ state, display }) => (
              <tr key={state.code}>
                <td>{state.name}</td>
                <td>{display}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}
