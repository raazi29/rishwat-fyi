import type { HTMLAttributes, ReactNode } from "react";

import type { ReportStatus } from "@/lib/api/types";
import { formatStatus } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { CloseIcon } from "@/components/icons";

/**
 * Badges and chips. Badges are the only place a third or fourth hue appears in
 * the system, and each verification badge maps to exactly one ladder state
 * (DESIGN.md §Colors rule 3). Chips are the only fully-rounded pills allowed:
 * the header descriptor and filter chips (DESIGN.md §Shapes).
 */

export type BadgeTone = "neutral" | "sage" | "evidence" | "process" | "official-solid";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-ink-secondary",
  sage: "bg-sage text-official-mid",
  evidence: "bg-evidence-tint text-evidence",
  process: "bg-process-tint text-process",
  "official-solid": "bg-official text-white",
};

/**
 * A small tinted label at 6px radius. Never a pill (chips own the pill shape).
 * Used for verification status, the "median" descriptor, and evidence counts.
 */
export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-label font-medium",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/** The exact ladder-state → tone mapping from DESIGN.md §Colors rule 3. */
const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  submitted: "neutral",
  validated: "sage",
  corroborated: "sage",
  evidence_backed: "evidence",
  officially_acknowledged: "official-solid",
  rejected: "neutral",
  withdrawn: "neutral",
};

/**
 * A verification badge for a report/aggregate. Colour is carried by tone and
 * the label together (never colour alone), so the state is legible in
 * greyscale. The two terminal states render in muted ink per rule 3. Seen in
 * the comparison table's verification column and the service detail header.
 */
export function VerificationBadge({
  status,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "children"> & { status: ReportStatus }) {
  const terminal = status === "rejected" || status === "withdrawn";
  return (
    <Badge
      tone={STATUS_TONE[status]}
      className={cn(terminal && "text-ink-muted", className)}
      {...props}
    >
      {formatStatus(status)}
    </Badge>
  );
}

export type ChipTone = "neutral" | "sage";

const CHIP_TONES: Record<ChipTone, string> = {
  neutral: "border-line bg-surface text-ink-secondary",
  sage: "border-transparent bg-sage text-official-mid",
};

/**
 * A fully-rounded pill for the header descriptor ("Public data. Verified
 * process. Powered by citizens.") and for active filter chips. When `onRemove`
 * is supplied a trailing dismiss control appears for the search filter rail.
 */
export function Chip({
  tone = "neutral",
  leadingDot = false,
  onRemove,
  removeLabel = "Remove filter",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  leadingDot?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-label font-medium",
        CHIP_TONES[tone],
        className,
      )}
      {...props}
    >
      {leadingDot ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-official-soft" />
      ) : null}
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 ml-0.5 inline-flex items-center justify-center rounded-full p-0.5 text-ink-muted transition-colors duration-150 hover:text-ink active:text-ink"
        >
          <CloseIcon size={14} />
        </button>
      ) : null}
    </span>
  );
}
