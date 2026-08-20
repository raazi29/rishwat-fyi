import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { CheckIcon } from "@/components/icons";

/**
 * The report wizard's 5-step indicator (DESIGN.md §Components: report wizard).
 * Reached steps are filled official green — done steps show a check, the active
 * step its number; upcoming steps are muted outlines. Horizontal with a
 * progress rail on ≥640px; a compact "Step N of M" with a progress bar on
 * phones, so the same information is restructured rather than truncated.
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

function StepCircle({ state, number }: { state: "done" | "active" | "upcoming"; number: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-label font-semibold",
        state === "upcoming"
          ? "border border-line bg-surface text-ink-muted"
          : "bg-official text-white",
      )}
    >
      {state === "done" ? <CheckIcon size={18} /> : number}
    </span>
  );
}

/**
 * The step indicator. `current` is the 0-based index of the active step.
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
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className={className}>
      {/* Desktop / tablet: horizontal rail + labelled steps */}
      <div className="hidden sm:block">
        <ProgressBar value={progress} label={ariaLabel} className="mb-5" />
        <ol className="flex items-start">
          {steps.map((step, index) => {
            const state = index < current ? "done" : index === current ? "active" : "upcoming";
            return (
              <li
                key={index}
                aria-current={state === "active" ? "step" : undefined}
                className="flex flex-1 items-start gap-3 pr-4 last:flex-none"
              >
                <StepCircle state={state} number={index + 1} />
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-label font-semibold",
                      state === "upcoming" ? "text-ink-muted" : "text-ink",
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description ? (
                    <div className="text-label text-ink-muted">{step.description}</div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Phone: compact position + progress bar */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-label font-semibold text-ink">
            {active?.title ?? ""}
          </span>
          <span className="text-label text-ink-muted">
            Step {Math.min(current + 1, total)} of {total}
          </span>
        </div>
        <ProgressBar value={progress} label={ariaLabel} />
      </div>
    </div>
  );
}
