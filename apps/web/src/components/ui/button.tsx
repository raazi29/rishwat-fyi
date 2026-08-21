import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-official text-white hover:bg-official-deep active:bg-official-deep",
  secondary:
    "border border-line bg-surface text-ink hover:bg-sunken active:bg-sunken",
  quiet:
    "text-official-mid underline decoration-line-inner decoration-2 underline-offset-4 hover:decoration-official-mid",
  ghost: "text-ink-secondary hover:bg-sunken hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  // md and lg clear 44px everywhere. sm stays dense for mouse-driven admin and
  // toolbar rows, but grows to 44px on touch pointers, where the reporter is.
  sm: "min-h-9 px-3 text-label pointer-coarse:min-h-11",
  md: "min-h-11 px-4 text-label",
  lg: "min-h-12 px-5 text-body",
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
 * The recurring "Learn more →" affordance from the reference boards: green
 * label, arrow, underline on hover only.
 */
export function ActionLink({
  href,
  children,
  external = false,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean }) {
  const classes = cn(
    "group inline-flex items-center gap-1.5 text-label font-medium text-official-mid transition-colors duration-150 hover:text-official-deep",
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
