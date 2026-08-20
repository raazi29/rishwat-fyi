import { Fragment, type ReactNode } from "react";

import { IconTile } from "@/components/ui";
import {
  ArrowRightIcon,
  BuildingIcon,
  ChartIcon,
  DocumentIcon,
  ShieldCheckIcon,
  UsersIcon,
  DatabaseIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils/cn";

interface LoopNode {
  icon: ReactNode;
  label: string;
}

const LOOP: LoopNode[] = [
  { icon: <BuildingIcon />, label: "Official procedure" },
  { icon: <UsersIcon />, label: "Citizen experience" },
  { icon: <DocumentIcon />, label: "Structured report" },
  { icon: <ShieldCheckIcon />, label: "Verification" },
  { icon: <ChartIcon />, label: "Aggregate pattern" },
  { icon: <DatabaseIcon />, label: "Public data" },
];

/**
 * The core loop as a directed flow of icon tiles joined by arrows — a diagram,
 * not a card grid. It stacks vertically on phones (arrows turn downward) and
 * runs horizontally from the medium breakpoint up.
 */
export function CoreLoop({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-line bg-sunken p-6 lg:p-8", className)}>
      <div
        role="list"
        aria-label="The core loop, in order"
        className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-2"
      >
        {LOOP.map((node, index) => (
          <Fragment key={node.label}>
            <div
              role="listitem"
              className="flex items-center gap-3 md:w-24 md:flex-col md:text-center"
            >
              <IconTile>{node.icon}</IconTile>
              <span className="text-label font-semibold text-ink md:mt-1">{node.label}</span>
            </div>
            {index < LOOP.length - 1 ? (
              <ArrowRightIcon
                aria-hidden="true"
                className="ml-[0.6rem] shrink-0 rotate-90 text-ink-muted md:ml-0 md:mt-2.5 md:rotate-0"
              />
            ) : null}
          </Fragment>
        ))}
      </div>
      <p className="mt-6 border-t border-line-inner pt-4 text-label text-ink-muted">
        The loop repeats. Every new report is checked against the same threshold and feeds the same
        public dataset, so the picture sharpens over time rather than resting on any single account.
      </p>
    </div>
  );
}
