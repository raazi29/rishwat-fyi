import Link from "next/link";

import { cn } from "@/lib/utils/cn";

import { RishwatMark } from "./rishwat-mark";

/**
 * The one place the logo lockup is defined — the mark beside the serif wordmark —
 * so the header, the footer and the mobile menu can never drift apart.
 *
 * The wordmark stays live text rather than becoming part of the artwork: it
 * inherits the theme, scales with the type scale, and needs no alt-text
 * duplicate for screen readers. The lockup as a whole carries the accessible
 * name, and the mark is `aria-hidden`, so assistive tech reads "Rishwat.fyi"
 * once.
 */
export function BrandLogo({
  size = "md",
  href = "/",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md";
  /** Render as a link when set; a plain block otherwise (e.g. inside a dialog). */
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <RishwatMark size={size === "sm" ? 26 : 30} className="shrink-0" />
      {showWordmark ? (
        <span
          className={cn(
            "whitespace-nowrap font-serif font-bold leading-none tracking-tight text-official",
            size === "sm" ? "text-h3" : "text-h3 sm:text-h2",
          )}
        >
          Rishwat.fyi
        </span>
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href === null) {
    return (
      <span className={classes} aria-label="Rishwat.fyi">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} aria-label="Rishwat.fyi — home" className={classes}>
      {content}
    </Link>
  );
}
