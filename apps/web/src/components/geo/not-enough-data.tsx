import { cn } from "@/lib/utils/cn";

/**
 * The inline marker for a figure that cannot be shown: a below-threshold
 * citizen median, or a metric the published data does not carry yet. It never
 * renders a zero in place of missing data (Product Principle 4 / build-contract)
 * — it says, quietly, that there is not enough to publish.
 *
 * `variant="cell"` is the compact form for a numeric table cell (an em dash with
 * a screen-reader sentence); `variant="text"` is the spelled-out inline form.
 */
export function NotEnoughData({
  variant = "cell",
  label = "Not enough reports yet",
  className,
}: {
  variant?: "cell" | "text";
  label?: string;
  className?: string;
}) {
  if (variant === "text") {
    return <span className={cn("text-label text-ink-muted", className)}>{label}</span>;
  }
  return (
    <span className={cn("text-ink-muted", className)}>
      <span aria-hidden="true">{"\u2014"}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
