import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Premium button system.
 *
 * Design philosophy (researched from Linear, Vercel, Stripe, Raycast):
 *
 * 1. DEPTH: Primary uses a gradient background (not flat) with a bright top-edge
 *    highlight simulating light hitting the surface — makes it feel like a
 *    physical object you can press.
 * 2. MOTION: `duration-200` with an `ease-[cubic-bezier(0.4,0,0.2,1)]` for
 *    natural deceleration. The press moves 1px (not 2) — subtle, not bouncy.
 * 3. SHADOW LAYERS: Two-layer shadow — a tight near-shadow for definition, a
 *    broader ambient for depth. On hover the ambient grows; on press both
 *    collapse. This simulates raising the button toward you and pressing it in.
 * 4. BORDER: Secondary uses a 1px border that's slightly darker on hover,
 *    with a barely-visible outer glow (ring) replacing heavy shadow.
 * 5. FOCUS: A green ring offset 2px — accessibility without distraction.
 */
const BASE =
  "inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-semibold tracking-[-0.01em] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none disabled:shadow-none disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: [
    // Gradient: subtle top-to-bottom creates a lit surface
    "bg-gradient-to-b from-[color-mix(in_srgb,var(--color-official)_100%,white_8%)] to-official",
    "text-ink-inverse",
    // Two-layer shadow: tight edge + soft ambient
    "shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0px_0px_1px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.12)]",
    // Hover: deeper ambient, brighter gradient top
    "hover:from-[color-mix(in_srgb,var(--color-official)_100%,white_12%)] hover:to-official-deep",
    "hover:shadow-[0_3px_8px_-2px_rgba(0,0,0,0.25),0_0px_0px_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.14)]",
    // Press: flatten shadow, push 1px — tactile
    "active:translate-y-[1px] active:shadow-[0_0px_1px_rgba(0,0,0,0.15),0_0px_0px_1px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(0,0,0,0.1)]",
    "active:from-official active:to-official",
  ].join(" "),

  secondary: [
    "border border-line/80 bg-surface text-ink",
    // Subtle outer glow instead of a heavy shadow
    "shadow-[0_1px_2px_rgba(0,0,0,0.03),0_0px_0px_1px_rgba(0,0,0,0.02)]",
    "ring-1 ring-transparent",
    // Hover: border darkens, faint green glow
    "hover:border-official-mid/50 hover:bg-sunken/60",
    "hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_0px_0px_1px_rgba(15,61,38,0.08)]",
    // Press
    "active:translate-y-[1px] active:shadow-none active:bg-sunken",
  ].join(" "),

  quiet: [
    "text-official-mid",
    "underline decoration-transparent decoration-[1.5px] underline-offset-[5px]",
    "hover:text-official-deep hover:decoration-official-mid/40",
    "active:translate-y-[0.5px]",
  ].join(" "),

  ghost: [
    "text-ink-secondary",
    "hover:bg-sunken hover:text-ink",
    "active:translate-y-[0.5px] active:bg-sunken",
  ].join(" "),
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-[13px] leading-none pointer-coarse:min-h-11",
  md: "min-h-11 px-[18px] text-[13.5px] leading-none",
  lg: "min-h-[52px] px-7 text-[15px] leading-none",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
}

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingLabel?: string;
  };

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  iconLeading,
  iconTrailing,
  loading = false,
  loadingLabel = "Working…",
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        variant === "quiet" && "px-0",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : iconLeading}
      <span>{loading ? loadingLabel : children}</span>
      {loading ? null : iconTrailing}
    </button>
  );
}

export type ButtonLinkProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    /** Set for downloads and cross-origin links. */
    external?: boolean;
  };

export function ButtonLink({
  variant = "secondary",
  size = "md",
  block = false,
  iconLeading,
  iconTrailing,
  external = false,
  className,
  children,
  href,
  ...props
}: ButtonLinkProps) {
  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    variant === "quiet" && "px-0",
    className,
  );

  if (external) {
    return (
      <a
        href={href}
        rel="noreferrer noopener"
        target="_blank"
        className={classes}
        {...props}
      >
        {iconLeading}
        <span>{children}</span>
        {iconTrailing}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {iconLeading}
      <span>{children}</span>
      {iconTrailing}
    </Link>
  );
}

/**
 * The recurring "Learn more →" affordance from the reference boards. The
 * visual line stays quiet; its 44px hit target works on a phone.
 */
export function ActionLink({
  href,
  children,
  external = false,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean }) {
  const classes = cn(
    "group inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-official-mid transition-colors duration-150 hover:text-official-deep",
    className,
  );
  const content = (
    <>
      <span className="underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 group-hover:decoration-current">
        {children}
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-150 group-hover:translate-x-0.5"
      >
        <path d="M4.5 12h15M13.5 6l6 6-6 6" />
      </svg>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {content}
    </Link>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
