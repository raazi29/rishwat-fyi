import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { IconTile } from "@/components/ui/surface";
import { ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowRightIcon, UsersIcon } from "@/components/icons";

/**
 * Loading, empty, and error affordances. Loading uses sunken pulse blocks, not
 * spinners, inside content. The threshold empty state states the publishing
 * rule and offers the report action rather than shrugging (DESIGN.md
 * §Components). None of these use red as an error colour — red is a data
 * channel only (§Colors rule 1).
 */

/**
 * A sunken pulse placeholder. Set dimensions through `className`
 * (e.g. `h-6 w-40`); it carries no default size. Decorative, so aria-hidden.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-sunken", className)}
      {...props}
    />
  );
}

/**
 * A centred empty state: icon tile, title, explanation, and an optional action.
 * Deliberately borderless so it can sit inside a Card or Panel without creating
 * a nested card (DESIGN.md §Don't).
 */
export function EmptyState({
  icon,
  media,
  title,
  description,
  action,
  tone = "sage",
  className,
}: {
  icon?: ReactNode;
  /**
   * Optional illustration shown instead of the icon tile — e.g. a brand
   * illustration for a hero empty state. Cap its width at the call site so it
   * never dominates a phone screen.
   */
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "sage" | "sand";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      {media ? media : <IconTile tone={tone}>{icon}</IconTile>}
      <div className="space-y-1">
        <h3 className="font-sans text-h3 font-semibold text-ink">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-[52ch] text-body text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/**
 * Shown when a (service, district) cell is below the publishing threshold. It
 * states the rule, shows how many reports exist, and offers the report action —
 * the interface says what is missing (Product Principle 4).
 */
export function ThresholdEmptyState({
  reportCount = 0,
  reportHref = "/report",
  subject = "This service",
  className,
}: {
  reportCount?: number;
  reportHref?: string;
  subject?: string;
  className?: string;
}) {
  const reports = reportCount === 1 ? "report" : "reports";
  return (
    <EmptyState
      icon={<UsersIcon />}
      title="Not enough reports to publish yet"
      description={
        <>
          {subject} has <span className="font-semibold text-ink">{reportCount}</span> {reports} so
          far. Citizen figures are published only once there are at least 3 reports from at least 2
          independent sources, so no median is shown yet.
        </>
      }
      action={
        <ButtonLink href={reportHref} variant="primary" iconTrailing={<ArrowRightIcon size={18} />}>
          Report your experience
        </ButtonLink>
      }
      className={className}
    />
  );
}

/**
 * A neutral error state (never red). Pass an `action` such as a retry link.
 */
export function ErrorState({
  title = "We couldn't load this",
  description = "This data could not be loaded right now. Please try again in a moment.",
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <IconTile tone="sand">
        <AlertIcon />
      </IconTile>
      <div className="space-y-1">
        <h3 className="font-sans text-h3 font-semibold text-ink">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-[52ch] text-body text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
