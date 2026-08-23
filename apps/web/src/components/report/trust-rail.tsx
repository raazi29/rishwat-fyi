import type { ReactNode } from "react";

import { ActionLink } from "@/components/ui";
import {
  ChevronDownIcon,
  ClockIcon,
  DocumentIcon,
  HelpIcon,
  RupeeIcon,
  ShieldCheckIcon,
  VisitsIcon,
} from "@/components/icons";

/**
 * The report page's anonymity assurance. Formerly a persistent 288px left rail;
 * now one concise inline block directly below the page introduction (design
 * spec §Page hierarchy). Anonymity is still proven before the first field
 * (PRODUCT.md Principle 3) — but once, without the duplicated "100% Anonymous"
 * card or the unsupported "encrypted at rest" claim. "What can I report?" is an
 * optional disclosure so it never competes with the form for attention.
 */

const REPORTABLE: { icon: ReactNode; label: string }[] = [
  { icon: <RupeeIcon size={18} />, label: "Extra or unofficial payments requested or paid" },
  { icon: <ClockIcon size={18} />, label: "Delays beyond the official timeline" },
  { icon: <VisitsIcon size={18} />, label: "Unnecessary visits or procedures" },
  { icon: <DocumentIcon size={18} />, label: "Missing information or unclear requirements" },
  { icon: <HelpIcon size={18} />, label: "Any other friction in the process" },
];

export function TrustRail() {
  return (
    <div className="space-y-3">
      {/* Identity — a sanctioned sage "official callout" surface. */}
      <section className="flex items-start gap-3 rounded-lg bg-sage p-4">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-tile bg-surface text-official-mid">
          <ShieldCheckIcon size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-sans text-body font-semibold text-official">Your identity is safe</h2>
          <p className="mt-0.5 text-label text-official-mid">
            We never ask for your name, phone number, Aadhaar, PAN or address — only what is needed
            to understand the experience.
          </p>
          <ActionLink href="/privacy" className="mt-2">
            Learn more about anonymity
          </ActionLink>
        </div>
      </section>

      {/* What can I report? — an optional native disclosure. */}
      <details className="group rounded-lg border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-label font-semibold text-ink [&::-webkit-details-marker]:hidden">
          What can I report?
          <ChevronDownIcon
            size={18}
            aria-hidden="true"
            className="shrink-0 text-ink-muted transition-transform duration-150 group-open:rotate-180"
          />
        </summary>
        <ul className="space-y-2.5 border-t border-line-inner px-4 py-3 text-label text-ink-secondary">
          {REPORTABLE.map((item) => (
            <li key={item.label} className="flex items-start gap-2.5">
              <span className="mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-sage text-official-mid">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
