import { cn } from "@/lib/utils/cn";
import { ClockIcon } from "@/components/icons";
import { formatDateTime } from "@/lib/utils/format";

/**
 * A subtle 'last updated' indicator shown alongside citizen aggregate data.
 * Answers the question "how fresh are these numbers?" without competing with
 * the data itself. Uses the muted ink tone and small label size.
 */
export function DataFreshness({
  updatedAt,
  className,
}: {
  /** ISO datetime string of when the aggregate was last computed. */
  updatedAt: string | null | undefined;
  className?: string;
}) {
  if (!updatedAt) return null;
  return (
    <p className={cn("flex items-center gap-1.5 text-label text-ink-muted", className)}>
      <ClockIcon size={14} aria-hidden="true" />
      <span>Data last updated {formatDateTime(updatedAt)}</span>
    </p>
  );
}
