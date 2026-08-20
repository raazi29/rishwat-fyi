import { Badge } from "@/components/ui";
import type { ReportStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

import { LADDER_STAGES, stageStateFor, type StageState } from "./status-copy";

const STATE_BADGE: Record<StageState, { label: string; tone: "sage" | "process" | "neutral" }> = {
  done: { label: "Completed", tone: "sage" },
  current: { label: "In progress", tone: "process" },
  pending: { label: "Pending", tone: "neutral" },
};

const CIRCLE: Record<StageState, string> = {
  done: "bg-sage text-official-mid",
  current: "bg-process-tint text-process",
  pending: "border border-line bg-surface text-ink-muted",
};

/**
 * The "What happens next?" ladder as a vertical timeline. Stage states are
 * derived from the report's actual status, so a freshly-submitted report shows
 * Submitted complete and Validation in progress (as on the board), while a
 * corroborated report shows more rungs done.
 */
export function SubmittedTimeline({ status }: { status: ReportStatus }) {
  return (
    <ol className="relative">
      {LADDER_STAGES.map((stage, index) => {
        const stageState = stageStateFor(index, status);
        const badge = STATE_BADGE[stageState];
        const Icon = stage.icon;
        const isLast = index === LADDER_STAGES.length - 1;
        return (
          <li key={stage.status} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute left-[17px] top-10 bottom-1 w-px bg-line-inner"
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                CIRCLE[stageState],
              )}
            >
              <Icon size={18} />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-sans text-h3 font-semibold text-ink">
                  {index + 1}. {stage.title}
                </h3>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
              <p className="mt-0.5 text-label text-ink-secondary">{stage.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
