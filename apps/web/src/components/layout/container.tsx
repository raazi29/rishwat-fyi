import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";

/**
 * Page scaffolding. The Container sets the 1440px max width and the
 * 16/24/40px gutters from DESIGN.md §Layout. PageHeader is the service-detail
 * header (breadcrumbs, serif title with an adornment, meta row, actions).
 */

/** The centred page column with responsive gutters. */
export function Container({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:px-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Vertical rhythm wrapper for a page's main content. */
export function PageShell({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("py-8 lg:py-10", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * The page header from the service-detail board: an optional breadcrumb trail,
 * a serif h1 with an optional adornment (e.g. a verification shield), a subtitle
 * and meta row, and right-aligned actions that wrap below the title on phones.
 */
export function PageHeader({
  breadcrumbs,
  title,
  titleAdornment,
  subtitle,
  meta,
  actions,
  className,
}: {
  breadcrumbs?: Crumb[];
  title: ReactNode;
  titleAdornment?: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-h1 font-bold text-ink">{title}</h1>
            {titleAdornment}
          </div>
          {subtitle ? <p className="mt-1 text-body-lg text-ink-secondary">{subtitle}</p> : null}
          {meta ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-label text-ink-muted">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
