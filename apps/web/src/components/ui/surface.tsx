import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Surface primitives — the bordered white card and the sunken panel that carry
 * the whole record. Elevation in this system is a 1px hairline, never a shadow
 * (DESIGN.md §Elevation). Seen on every board: the hero stat panel, the search
 * filter rail, the service overview's four panels, the report trust rails.
 */

type DivProps = HTMLAttributes<HTMLDivElement>;

/**
 * A white, hairline-bordered card at 12px radius. Never shadowed. Compose with
 * CardHeader / CardBody / CardFooter, or pass `padded` for a simple padded box.
 * The signature container of the reference boards.
 */
export function Card({
  padded = false,
  className,
  children,
  ...props
}: DivProps & { padded?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface text-ink-secondary",
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A sunken panel (bg-sunken) at 12px radius with the same hairline border —
 * used for grouped content that should recede from the white cards: the hero
 * stat/map panel, the "How it works" band, the report trust and tips rails.
 */
export function Panel({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-sunken text-ink-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Card header row with a bottom hairline. Holds a CardTitle and optional actions. */
export function CardHeader({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-line-inner px-5 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card title in the operational (sans) voice at h3 scale — card titles are
 * labels, not the record's serif headings. Use `as` to keep the heading order
 * correct on the page.
 */
export function CardTitle({
  as: Tag = "h3",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <Tag
      className={cn(
        "font-sans text-h3 font-semibold tracking-tight text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Card body with the standard 20px padding. */
export function CardBody({ className, children, ...props }: DivProps) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

/** Card footer with a top hairline; sits below the body. */
export function CardFooter({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-line-inner px-5 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A section heading in the record's serif voice at h2 scale, carrying the
 * layout rhythm from DESIGN.md §Layout: 32px above, 12px below. An optional
 * description sits under it in muted body. Seen above "How it works", "See the
 * gap. Make it visible.", and every major panel group.
 */
export function SectionHeading({
  as: Tag = "h2",
  description,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & {
  as?: "h2" | "h3";
  description?: ReactNode;
}) {
  return (
    <div className={cn("mt-8 mb-3 first:mt-0", className)}>
      <Tag className="font-serif text-h2 font-bold text-ink" {...props}>
        {children}
      </Tag>
      {description ? (
        <p className="mt-1.5 max-w-[68ch] text-body text-ink-secondary">{description}</p>
      ) : null}
    </div>
  );
}

/**
 * A hairline rule using the inner-rule token (the softer line reserved for
 * dividers inside a card). Horizontal by default; vertical for the seams
 * between figures in a stat strip or gap panel.
 */
export function Divider({
  orientation = "horizontal",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "border-line-inner",
        orientation === "horizontal" ? "border-t" : "self-stretch border-l",
        className,
      )}
      {...props}
    />
  );
}

/**
 * A 36px rounded tile holding an authored line icon — the sage/official pairing
 * behind every icon on the boards (how-it-works steps, footer commitments,
 * field group markers). `tone="sand"` is the secondary tile.
 */
export function IconTile({
  tone = "sage",
  className,
  children,
  ...props
}: DivProps & { tone?: "sage" | "sand" }) {
  return (
    <div
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-tile text-official-mid",
        tone === "sand" ? "bg-sand" : "bg-sage",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
