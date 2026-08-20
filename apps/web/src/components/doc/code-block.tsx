import { cn } from "@/lib/utils/cn";
import { CopyButton } from "@/components/ui/copy-button";

/**
 * A plain-text code block: mono, sunken, inner-hairline, horizontally
 * scrollable, with a CopyButton. There is no syntax-highlighting dependency —
 * the design restricts mono to report IDs, API paths and data snippets, so
 * plain text is correct and cheaper. A server component; only the copy control
 * is a client leaf. Long lines scroll (code legitimately scrolls) while the
 * copy control stays pinned outside the scroll area.
 */
export function CodeBlock({
  code,
  label,
  ariaLabel,
  copy = true,
  className,
}: {
  code: string;
  /** Optional caption above the block, e.g. "Response 200" or "bash". */
  label?: string;
  ariaLabel?: string;
  copy?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("mt-4", className)}>
      {label ? (
        <figcaption className="rounded-t-md border border-b-0 border-line-inner bg-sunken px-3 py-2 text-label font-medium text-ink-muted">
          {label}
        </figcaption>
      ) : null}
      <div className="relative">
        {copy ? (
          <div className="absolute right-2 top-2 z-10">
            <CopyButton value={code} showLabel={false} label="Copy code" />
          </div>
        ) : null}
        <pre
          aria-label={ariaLabel}
          className={cn(
            "overflow-x-auto border border-line-inner bg-sunken p-4",
            copy && "pr-14",
            label ? "rounded-b-md" : "rounded-md",
          )}
        >
          <code className="font-mono text-label text-ink">{code}</code>
        </pre>
      </div>
    </figure>
  );
}
