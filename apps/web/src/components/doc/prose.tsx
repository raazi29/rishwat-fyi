import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Typographic wrapper for Read-surface article bodies. It applies the record's
 * rhythm to raw `h2 / h3 / p / ul / ol / blockquote / a / strong / code`
 * descendants using Tailwind child selectors only — no typography plugin — so
 * everything stays inside the design tokens (DESIGN.md). Pair the running-text
 * variant with `prose-measure` for the ~68ch reading measure; tables and cards
 * are laid out separately at full column width.
 */
export function Prose({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // overflow-wrap is inherited, so breaking here lets long identifiers,
        // API paths and URLs in code/links wrap rather than push the page wide
        "text-body text-ink-secondary break-words",
        // Paragraph rhythm
        "[&>p]:mt-4 [&>p:first-child]:mt-0",
        // Sub-headings inside a section body
        "[&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-serif [&_h2]:text-h2 [&_h2]:font-bold [&_h2]:text-ink",
        "[&_h3]:mt-7 [&_h3]:scroll-mt-24 [&_h3]:font-sans [&_h3]:text-h3 [&_h3]:font-semibold [&_h3]:text-ink",
        // Lists
        "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
        "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
        "[&_li]:pl-1 [&_li]:marker:text-ink-muted",
        "[&_li_ul]:mt-2 [&_li_ol]:mt-2",
        // Links
        "[&_a]:font-medium [&_a]:text-official-mid [&_a]:underline [&_a]:decoration-line-inner [&_a]:decoration-1 [&_a]:underline-offset-2 hover:[&_a]:decoration-official-mid",
        // Emphasis
        "[&_strong]:font-semibold [&_strong]:text-ink",
        // Inline code — mono is reserved for IDs, paths and snippets (DESIGN.md)
        "[&_code]:rounded-xs [&_code]:bg-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink",
        // Blockquote — the record's pull-quote voice; 1px official-soft rule
        "[&_blockquote]:mt-6 [&_blockquote]:border-l [&_blockquote]:border-official-soft [&_blockquote]:pl-4 [&_blockquote]:font-serif [&_blockquote]:text-body-lg [&_blockquote]:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
