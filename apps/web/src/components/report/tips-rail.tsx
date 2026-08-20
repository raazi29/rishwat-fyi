import type { ReactNode } from "react";

import { ActionLink } from "@/components/ui";
import { CheckCircleIcon, EyeOffIcon, DocumentIcon, LockIcon } from "@/components/icons";

/**
 * The right tips rail (264px on ≥1200px). Practical advice for a good report
 * plus the anonymity reassurance. Copy is verbatim from the report-flow board.
 * Card titles are the operational (sans) voice per DESIGN.md, matching the left
 * trust rail so the two rails read as a pair.
 */

const TIPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <CheckCircleIcon size={18} />,
    title: "Be specific",
    body: "Share details like amounts, dates, and number of visits.",
  },
  {
    icon: <EyeOffIcon size={18} />,
    title: "Avoid personal info",
    body: "Do not include names, phone numbers or addresses.",
  },
  {
    icon: <DocumentIcon size={18} />,
    title: "Provide evidence (optional)",
    body: "Screenshots, receipts or photos help verification.",
  },
];

export function TipsRail() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-sans text-h3 font-semibold text-ink">Tips for a helpful report</h2>
        <ul className="mt-3 space-y-3.5">
          {TIPS.map((tip) => (
            <li key={tip.title} className="flex items-start gap-2.5">
              <span className="mt-px inline-flex size-7 shrink-0 items-center justify-center rounded-tile bg-sage text-official-mid">
                {tip.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-label font-semibold text-ink">{tip.title}</span>
                <span className="block text-label text-ink-secondary">{tip.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-tile bg-sage text-official-mid">
            <LockIcon size={20} />
          </span>
          <h2 className="font-sans text-h3 font-semibold text-ink">100% Anonymous</h2>
        </div>
        <p className="mt-3 text-label text-ink-secondary">
          All reports are anonymous by default and encrypted in transit and at rest.
        </p>
        <ActionLink href="/privacy" className="mt-3">
          Read our privacy policy
        </ActionLink>
      </section>
    </div>
  );
}
