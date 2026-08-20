import { Badge, VerificationBadge } from "@/components/ui";
import { VERIFICATION_LADDER, type ReportStatus } from "@/lib/api/types";
import { formatStatus } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CheckIcon } from "@/components/icons";

import { ladderIndex } from "./status-copy";

type NodeState = "done" | "current" | "pending";

const CIRCLE: Record<NodeState, string> = {
  done: "bg-official text-white",
  current: "bg-official text-white ring-2 ring-official-mid ring-offset-2 ring-offset-surface",
  pending: "border border-line bg-surface text-ink-muted",
};

/**
 * The five-rung verification ladder with the reached rungs filled official
 * green and the report's current rung marked. Terminal reports (rejected /
 * withdrawn) sit off the ladder and are shown with their muted badge instead of
 * a false position.
 */
export function StatusLadder({ status }: { status: ReportStatus }) {
  const reached = ladderIndex(status);

  if (reached === null) {
    return (
      <div className="rounded-md border border-line bg-sunken p-4">
        <div className="flex items-center gap-2">
          <span className="text-label text-ink-muted">This report is</span>
          <VerificationBadge status={status} />
        </div>
        <p className="mt-2 text-body text-ink-secondary">
          It is not on the active verification ladder and is no longer progressing.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {VERIFICATION_LADDER.map((rung, index) => {
        const nodeState: NodeState = index < reached ? "done" : index === reached ? "current" : "pending";
        const isLast = index === VERIFICATION_LADDER.length - 1;
        return (
          <li key={rung} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[15px] top-9 bottom-0 w-px",
                  index < reached ? "bg-official-soft" : "bg-line-inner",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-label font-semibold",
                CIRCLE[nodeState],
              )}
            >
              {index < reached ? <CheckIcon size={16} /> : index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "font-sans text-body font-semibold",
                    nodeState === "pending" ? "text-ink-muted" : "text-ink",
                  )}
                >
                  {formatStatus(rung)}
                </span>
                {nodeState === "current" ? <Badge tone="sage">Current level</Badge> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
