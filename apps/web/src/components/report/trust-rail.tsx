import type { ReactNode } from "react";

import { ActionLink } from "@/components/ui";
import {
  ClockIcon,
  DocumentIcon,
  HelpIcon,
  RupeeIcon,
  ShieldCheckIcon,
  UsersIcon,
  VisitsIcon,
} from "@/components/icons";

/**
 * The left trust rail (288px on ≥1200px). Anonymity is a designed experience,
 * proven before the first field (PRODUCT.md Principle 3). Copy is verbatim from
 * the report-flow board.
 */

function RailCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-tile bg-sage text-official-mid">
          {icon}
        </span>
        <h2 className="font-sans text-h3 font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-label text-ink-secondary">{children}</div>
    </section>
  );
}

const REPORTABLE: { icon: ReactNode; label: string }[] = [
  { icon: <RupeeIcon size={18} />, label: "Extra or unofficial payments requested or paid" },
  { icon: <ClockIcon size={18} />, label: "Delays beyond the official timeline" },
  { icon: <VisitsIcon size={18} />, label: "Unnecessary visits or procedures" },
  { icon: <DocumentIcon size={18} />, label: "Missing information or unclear requirements" },
  { icon: <HelpIcon size={18} />, label: "Any other friction in the process" },
];

export function TrustRail() {
  return (
    <div className="space-y-5">
      {/* Identity — a sanctioned sage "official callout" surface. */}
      <section className="rounded-lg bg-sage p-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-tile bg-surface text-official-mid">
            <ShieldCheckIcon size={20} />
          </span>
          <h2 className="font-sans text-h3 font-semibold text-official">Your identity is safe</h2>
        </div>
        <div className="mt-3 space-y-2 text-label text-official-mid">
          <p>We never ask for your name, phone number, Aadhaar, PAN or address.</p>
          <p>We collect only what is needed to understand the experience.</p>
        </div>
        <ActionLink href="/privacy" className="mt-3">
          Learn more about anonymity
        </ActionLink>
      </section>

      <RailCard icon={<DocumentIcon size={20} />} title="What can I report?">
        <ul className="space-y-2.5">
          {REPORTABLE.map((item) => (
            <li key={item.label} className="flex items-start gap-2.5">
              <span className="mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-sage text-official-mid">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard icon={<UsersIcon size={20} />} title="Why report?">
        <p>Your report helps build public data that can drive systemic change.</p>
      </RailCard>

      <RailCard icon={<HelpIcon size={20} />} title="Need help?">
        <p>If you are facing immediate harm, contact official grievance portals.</p>
        <ActionLink href="/about#resources" className="mt-1">
          View resources
        </ActionLink>
      </RailCard>
    </div>
  );
}
