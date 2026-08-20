import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { InfoIcon, ScaleIcon, ShieldCheckIcon } from "@/components/icons";

/**
 * Inline callouts and the two mandatory strips. Callouts carry information in a
 * tinted box with an icon and, on the coloured tints, text drawn from that
 * surface's own hue rather than grey (DESIGN.md §Colors rule 4). The `reported`
 * tone is reserved for citizen-reported context, never for errors.
 */

export type CalloutTone = "notice" | "info" | "official" | "reported";

interface ToneStyle {
  box: string;
  title: string;
  body: string;
  icon: string;
  fallbackIcon: ReactNode;
}

const CALLOUT_TONES: Record<CalloutTone, ToneStyle> = {
  notice: {
    box: "bg-sand",
    title: "text-ink",
    body: "text-ink-secondary",
    icon: "text-official-mid",
    fallbackIcon: <InfoIcon size={20} />,
  },
  info: {
    box: "bg-process-tint",
    title: "text-process",
    body: "text-process",
    icon: "text-process",
    fallbackIcon: <InfoIcon size={20} />,
  },
  official: {
    box: "bg-sage",
    title: "text-official",
    body: "text-official-mid",
    icon: "text-official-mid",
    fallbackIcon: <ShieldCheckIcon size={20} />,
  },
  reported: {
    box: "bg-reported-tint",
    title: "text-reported",
    body: "text-reported",
    icon: "text-reported",
    fallbackIcon: <InfoIcon size={20} />,
  },
};

/**
 * A tinted callout with an icon, optional title, and body. Used for the report
 * flow's "Stay safe", the service page's "Important", and the submitted page's
 * "under review" strip.
 */
export function Callout({
  tone = "notice",
  icon,
  title,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: CalloutTone; icon?: ReactNode; title?: ReactNode }) {
  const style = CALLOUT_TONES[tone];
  return (
    <div role="note" className={cn("flex gap-3 rounded-md p-4", style.box, className)} {...props}>
      <span aria-hidden="true" className={cn("mt-0.5 shrink-0", style.icon)}>
        {icon ?? style.fallbackIcon}
      </span>
      <div className="min-w-0">
        {title ? <div className={cn("text-body font-semibold", style.title)}>{title}</div> : null}
        {children ? (
          <div className={cn("text-label", style.body, title && "mt-0.5")}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The mandatory notice, verbatim (PRODUCT.md). It must appear wherever citizen
 * aggregates are shown. The API also returns this string; pass it through
 * `notice` when available, otherwise the constant is used unchanged.
 */
export const MANDATORY_NOTICE =
  "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing.";

export function NoticeStrip({
  notice = MANDATORY_NOTICE,
  className,
}: {
  notice?: string;
  className?: string;
}) {
  return (
    <Callout tone="notice" icon={<ScaleIcon size={20} />} className={className}>
      {notice}
    </Callout>
  );
}

/**
 * A persistent, labelled strip stating that fixtures are being shown because
 * the API was unreachable. Fallback content is never presented as live data
 * (PRODUCT.md). `reason` surfaces the underlying failure message.
 */
export function SampleDataStrip({ reason, className }: { reason?: string; className?: string }) {
  return (
    <Callout tone="notice" title="Sample data" className={className}>
      These figures are sample data, shown because live data could not be loaded
      {reason ? ` (${reason})` : ""}. They are illustrative and are not live citizen reports.
    </Callout>
  );
}
