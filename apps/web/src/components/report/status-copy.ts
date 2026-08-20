/**
 * Plain-language copy for the verification ladder — shared by the submitted
 * screen's "What happens next?" timeline and the status-lookup result. The
 * ladder itself is defined once in `@/lib/api` (`VERIFICATION_LADDER`); this
 * file only names each rung for citizens and never invents a state.
 */

import type { ReactNode } from "react";

import { VERIFICATION_LADDER, type ReportStatus } from "@/lib/api/types";
import {
  BuildingIcon,
  CheckCircleIcon,
  DocumentIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
  type IconProps,
} from "@/components/icons";

export interface LadderStage {
  /** The ladder status this stage corresponds to. */
  status: (typeof VERIFICATION_LADDER)[number];
  title: string;
  description: string;
  icon: (props: IconProps) => ReactNode;
}

/** The five stages, in ladder order, as worded on the submitted board. */
export const LADDER_STAGES: LadderStage[] = [
  {
    status: "submitted",
    title: "Submitted",
    description: "Your report has been received and recorded.",
    icon: DocumentIcon,
  },
  {
    status: "validated",
    title: "Validation",
    description: "We check for quality, spam and basic authenticity.",
    icon: SearchIcon,
  },
  {
    status: "corroborated",
    title: "Corroboration",
    description: "We compare with other independent reports for patterns.",
    icon: UsersIcon,
  },
  {
    status: "evidence_backed",
    title: "Verification",
    description: "Evidence is reviewed and the report moves to the next level.",
    icon: ShieldCheckIcon,
  },
  {
    status: "officially_acknowledged",
    title: "Impact",
    description: "Patterns are published in aggregate for public good.",
    icon: BuildingIcon,
  },
];

export type StageState = "done" | "current" | "pending";

/**
 * The 0-based position of a status on the public ladder, or `null` for the
 * terminal states (`rejected` / `withdrawn`) which sit off the ladder.
 */
export function ladderIndex(status: ReportStatus): number | null {
  const index = VERIFICATION_LADDER.indexOf(status as (typeof VERIFICATION_LADDER)[number]);
  return index === -1 ? null : index;
}

/**
 * State of stage `stageIndex` for a report at `status`: everything below the
 * reached rung is done, the reached rung is done, and the next rung is the one
 * "in progress". Terminal reports mark only what was reached as done.
 */
export function stageStateFor(stageIndex: number, status: ReportStatus): StageState {
  const reached = ladderIndex(status);
  if (reached === null) {
    // Terminal (rejected/withdrawn): nothing is "in progress".
    return stageIndex === 0 ? "done" : "pending";
  }
  if (stageIndex <= reached) return "done";
  if (stageIndex === reached + 1) return "current";
  return "pending";
}

export interface StatusCopy {
  meaning: string;
  next: string;
}

/** What each ladder state means for the reporter, and what happens next. */
export const STATUS_COPY: Record<ReportStatus, StatusCopy> = {
  submitted: {
    meaning: "Your report has been received and recorded. It has not been reviewed yet.",
    next: "A moderator will check it for quality, spam and basic authenticity.",
  },
  validated: {
    meaning: "Your report passed the first quality and authenticity checks.",
    next: "We now compare it with other independent reports for the same service and place.",
  },
  corroborated: {
    meaning:
      "Independent reports describe a similar experience, so this pattern is corroborated.",
    next: "If supporting evidence is available, the report can move to evidence-backed.",
  },
  evidence_backed: {
    meaning: "Supporting evidence has been reviewed and accepted for this report.",
    next: "The pattern may be raised to an official body for acknowledgement.",
  },
  officially_acknowledged: {
    meaning: "An official source has acknowledged this pattern. This is the highest level.",
    next: "The aggregate pattern remains published for the public record.",
  },
  rejected: {
    meaning:
      "This report was not accepted — usually because it could not be verified or fell outside what can be reported.",
    next: "Nothing further happens. You are welcome to file a new report about a real experience.",
  },
  withdrawn: {
    meaning: "This report was withdrawn and is no longer part of the published patterns.",
    next: "Nothing further happens.",
  },
};

/** The icon that best represents a terminal or ladder status in the result header. */
export function statusHeadlineIcon(status: ReportStatus): (props: IconProps) => ReactNode {
  if (status === "officially_acknowledged") return CheckCircleIcon;
  return LADDER_STAGES.find((stage) => stage.status === status)?.icon ?? DocumentIcon;
}
