import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { ActionLink, Callout, IconTile, SectionHeading } from "@/components/ui";
import {
  BuildingIcon,
  CheckIcon,
  CloseIcon,
  CodeIcon,
  CopyIcon,
  DatabaseIcon,
  DocumentIcon,
  HelpIcon,
  ScaleIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils/cn";

import { CoreLoop } from "./_components/core-loop";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Rishwat.fyi is, how the core loop turns experiences into public data, what it deliberately is not, and the governance and funding principles behind it.",
  alternates: { canonical: "/about" },
};

const IS_NOT: string[] = [
  "A blacklist of government employees",
  "An accusation engine",
  "A platform for naming or shaming individuals",
  "A replacement for government grievance systems",
  "A political propaganda platform",
  "A place to publish personal information",
  "A marketplace for bribes",
  "A system that automatically declares allegations to be facts",
];

interface Role {
  icon: ReactNode;
  title: string;
  body: string;
}

const ROLES: Role[] = [
  { icon: <CodeIcon />, title: "Technical maintainers", body: "Maintain the software." },
  {
    icon: <DatabaseIcon />,
    title: "Data stewards",
    body: "Maintain the methodology and the quality of the dataset.",
  },
  { icon: <ScaleIcon />, title: "Independent reviewers", body: "Review difficult moderation cases." },
  {
    icon: <UsersIcon />,
    title: "Community contributors",
    body: "Submit service information, government sources and reports.",
  },
  {
    icon: <CopyIcon />,
    title: "Public mirrors",
    body: "Independently preserve the datasets and the software.",
  },
];

const FUNDING_OK: string[] = [
  "Grants",
  "Philanthropic funding",
  "Research partnerships",
  "Non-profit structures",
  "Responsible sponsorship",
  "Public-interest technology funding",
];

// Official grievance routes, described generically. Rishwat.fyi measures
// patterns and is explicitly not a replacement for government grievance systems
// (plan §5), so we point people to the real routes without inventing URLs for
// portals the repository does not already cite.
const RESOURCES: Role[] = [
  {
    icon: <BuildingIcon />,
    title: "Public grievance portals",
    body: "Central and state governments run grievance portals where you can file and track a complaint about a specific service or office.",
  },
  {
    icon: <DocumentIcon />,
    title: "Right to Information (RTI)",
    body: "An RTI request formally asks a public authority for records — the official fee, the sanctioned timeline, or the status of your own application.",
  },
  {
    icon: <ScaleIcon />,
    title: "Departmental grievance cells",
    body: "The department or office that handled your case usually has its own grievance officer, with an escalation route above them.",
  },
  {
    icon: <ShieldIcon />,
    title: "Vigilance and anti-corruption bodies",
    body: "State vigilance commissions, Lokayukta offices and anti-corruption bureaus handle complaints of corruption against public officials.",
  },
  {
    icon: <HelpIcon />,
    title: "Citizen helplines",
    body: "Many states and departments publish citizen helpline numbers for urgent service problems and guidance.",
  },
];

export default function AboutPage() {
  return (
    <Container>
      <div className="py-8 lg:py-10">
        <header className="prose-measure">
          <h1 className="font-serif text-h1 font-bold text-ink">
            Government, as experienced by citizens
          </h1>
          <p className="mt-4 text-body-lg text-ink-secondary">
            Rishwat.fyi measures the gap between what a government service is officially supposed to
            cost, take and require, and what citizens actually experience — then publishes that gap
            as structured, anonymised, mirrorable public data.
          </p>
          <p className="mt-3 text-body text-ink-secondary">
            Existing grievance portals resolve individual complaints. Rishwat.fyi measures systemic
            patterns, and does so as infrastructure rather than as a website: open schemas, a public
            API, periodic dataset snapshots and documented methodology, so the data survives the
            interface.
          </p>
        </header>

        <section aria-labelledby="loop-heading" className="mt-12">
          <SectionHeading id="loop-heading">The core loop</SectionHeading>
          <p className="prose-measure text-body text-ink-secondary">
            Every published number comes from the same repeating process, and nothing skips a step.
          </p>
          <CoreLoop className="mt-6" />
        </section>

        <section aria-labelledby="not-heading" className="mt-12">
          <SectionHeading id="not-heading">What Rishwat.fyi is not</SectionHeading>
          <p className="prose-measure text-body text-ink-secondary">
            The platform measures patterns and experiences, not guilt. It is deliberately not:
          </p>
          <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {IS_NOT.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-body text-ink-secondary">
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted">
                  <CloseIcon size={18} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="gov-heading" className="mt-12">
          <SectionHeading id="gov-heading">Governance</SectionHeading>
          <p className="prose-measure text-body text-ink-secondary">
            Long-term governance is designed so it does not depend on any one person. The model
            defines five roles:
          </p>
          <dl className="mt-5 rounded-lg border border-line bg-surface">
            {ROLES.map((role, index) => (
              <div
                key={role.title}
                className={cn(
                  "flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-6",
                  index > 0 && "border-t border-line-inner",
                )}
              >
                <dt className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                  <IconTile>{role.icon}</IconTile>
                  <span className="font-sans text-h3 font-semibold text-ink">{role.title}</span>
                </dt>
                <dd className="text-body text-ink-secondary">{role.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="funding-heading" className="mt-12">
          <SectionHeading id="funding-heading">Funding philosophy</SectionHeading>
          <p className="prose-measure text-body text-ink-secondary">
            Rishwat.fyi does not have — and does not name — any funder, partner or sponsor. The
            governing principle is to avoid incentives that compromise credibility. Where funding is
            sought, it is limited to sources that cannot buy influence over the data:
          </p>
          <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {FUNDING_OK.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-body text-ink-secondary">
                <span aria-hidden="true" className="shrink-0 text-official-mid">
                  <CheckIcon size={18} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Callout tone="notice" title="What is never for sale" className="mt-6 prose-measure">
            {
              "Removing or altering a report in exchange for payment. That would destroy the platform's legitimacy, so it is not — and will not be — on offer."
            }
          </Callout>
        </section>

        <section id="resources" aria-labelledby="resources-heading" className="mt-12 scroll-mt-24">
          <SectionHeading id="resources-heading">Where to take a specific complaint</SectionHeading>
          <p className="prose-measure text-body text-ink-secondary">
            Rishwat.fyi measures patterns; it does not resolve individual cases, and it is not a
            replacement for government grievance systems. If you need a specific problem fixed, these
            official routes are the right place to start. Look up the exact portal for your state and
            department — we deliberately do not mirror or replace them.
          </p>
          <ul className="mt-5">
            {RESOURCES.map((resource, index) => (
              <li
                key={resource.title}
                className={cn(
                  "flex items-start gap-3 py-4",
                  index > 0 && "border-t border-line-inner",
                )}
              >
                <IconTile>{resource.icon}</IconTile>
                <div className="min-w-0">
                  <h3 className="font-sans text-h3 font-semibold text-ink">{resource.title}</h3>
                  <p className="mt-1 max-w-[62ch] text-body text-ink-secondary">{resource.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="more-heading" className="mt-12">
          <SectionHeading id="more-heading">Read the detail</SectionHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionLink href="/methodology">How the numbers are computed</ActionLink>
            <ActionLink href="/governance">The governance model</ActionLink>
            <ActionLink href="/privacy">Privacy and anonymity</ActionLink>
            <ActionLink href="/contribute">How to contribute</ActionLink>
          </div>
        </section>
      </div>
    </Container>
  );
}
