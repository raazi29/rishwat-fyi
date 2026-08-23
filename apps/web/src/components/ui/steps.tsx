import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { CheckIcon } from "@/components/icons";

/**
 * The report wizard's progress header. The earlier five-column labelled stepper
 * repeated each step's title and sub-label across the full width; this compact
 * form (design spec §Page hierarchy) shows the current step title, a progress
 * bar, and five small markers only — the same information, restructured rather
 * than truncated, and identical at every breakpoint so nothing overflows on a
 * phone.
 */

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
}

/**
 * A slim progress rail. `value` is measured against `max` (default 100). Use
 * `label` to name it for assistive tech when it stands alone.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { value: number; max?: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-official transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** A single compact marker (28px) — a filled green check when done, a filled
 * number for the active step, a muted outline for upcoming steps. Decorative:
 * the progress bar and the visible "Step N of M" carry the semantics. */
function StepMarker({ state, number }: { state: "done" | "active" | "upcoming"; number: number }) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-label font-semibold",
        state === "upcoming"
          ? "border border-line bg-surface text-ink-muted"
          : "bg-official text-white",
        state === "active" && "ring-2 ring-official/25",
      )}
    >
      {state === "done" ? <CheckIcon size={16} /> : number}
    </span>
  );
}

/**
 * The compact progress header. `current` is the 0-based index of the active
 * step. Renders the current step's title, a progress bar, and one marker per
 * step.
 */
export function Steps({
  steps,
  current,
  ariaLabel = "Report progress",
  className,
}: {
  steps: StepItem[];
  current: number;
  ariaLabel?: string;
  className?: string;
}) {
  const total = steps.length;
  const active = steps[current];
  const position = Math.min(current + 1, total);
  const progress = total > 0 ? (position / total) * 100 : 0;

  return (
    <div className={className}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate font-sans text-body font-semibold text-ink">
          {active?.title ?? ""}
        </p>
        <p className="shrink-0 text-label font-medium text-ink-muted">
          Step {position} of {total}
        </p>
      </div>

      <ProgressBar value={progress} label={ariaLabel} />

      <ol aria-hidden="true" className="mt-3 flex items-center gap-2">
        {steps.map((_, index) => {
          const state = index < current ? "done" : index === current ? "active" : "upcoming";
          return (
            <li key={index}>
              <StepMarker state={state} number={index + 1} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
