import type { Metadata } from "next";

import { ActionLink, Callout } from "@/components/ui";
import { DocLayout, DocSection, DocTable, Prose, type TableOfContentsItem } from "@/components/doc";

export const metadata: Metadata = {
  title: "Governance",
  description:
    "How Rishwat.fyi is governed and funded without compromising credibility: the separated roles, the independence guarantees, the funding sources it will and will not accept, and why pay-to-remove is structurally impossible.",
  alternates: { canonical: "/governance" },
};

const TOC: TableOfContentsItem[] = [
  { id: "roles", label: "Governance roles" },
  { id: "independence", label: "Independence" },
  { id: "funding", label: "Funding philosophy" },
  { id: "data", label: "Where it meets the data" },
];

const FUNDING_OK = [
  "Grants",
  "Philanthropic funding",
  "Research partnerships",
  "Non-profit structures",
  "Responsible sponsorship",
  "Public-interest technology funding",
];

export default function GovernancePage() {
  return (
    <DocLayout
      title="Governance"
      lead="The product's only real asset is trust. Governance and funding exist to protect it: no single person, party, or department should be able to bend the data, the moderation, or the methodology. Long-term governance should not depend entirely on the founder."
      toc={TOC}
      sourcePath="docs/governance.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Governance" }]}
    >
      <DocSection
        id="roles"
        title="Governance roles"
        lead="The roles are intentionally separated: the people who write the code are not the people who decide what the data means, and neither are the people who judge hard moderation cases."
      >
        <DocTable
          caption="Governance roles and responsibilities"
          columns={[
            { key: "role", header: "Role", primary: true },
            { key: "responsibility", header: "Responsibility" },
          ]}
          rows={[
            {
              role: "Technical maintainers",
              responsibility:
                "Maintain the software — the API, schema, migrations, tooling and infrastructure. Keep the code open and the builds reproducible.",
            },
            {
              role: "Data stewards",
              responsibility:
                "Maintain the methodology and dataset quality — the seed data, the government source registry, aggregate definitions and the data dictionary. Guardians of what gets counted and how.",
            },
            {
              role: "Independent reviewers",
              responsibility:
                "Review difficult moderation cases. A standing, volunteer group kept separate from the maintainers and from any single government department or political party.",
            },
            {
              role: "Community contributors",
              responsibility:
                "Submit service information, government sources and reports. More contributors → more coverage → better data.",
            },
            {
              role: "Public mirrors",
              responsibility:
                "Independently preserve datasets and software so the project survives any single point of failure.",
            },
          ]}
        />
        <Prose className="prose-measure mt-6">
          <p>
            That separation is the structural answer to the question &ldquo;who watches the
            watchmen.&rdquo; The escalation path that puts hard cases in front of independent
            reviewers is described in <a href="/moderation">moderation</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="independence"
        title="Independence"
        lead="Governance stays independent from individual political parties and government departments."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              No party, department or commercial interest appoints or controls moderators, data
              stewards or reviewers.
            </li>
            <li>
              Funding never buys influence over what is published, what is removed, or how statistics
              are computed.
            </li>
            <li>
              The methodology and moderation rules are published and version-controlled, so deviations
              are visible.
            </li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection
        id="funding"
        title="Funding philosophy"
        lead="Funding is designed to avoid incentives that compromise credibility. Rishwat.fyi does not have — and does not name — any funder, partner or sponsor."
      >
        <Prose className="prose-measure">
          <p>Where funding is sought, it is limited to sources that cannot buy influence over the data:</p>
          <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {FUNDING_OK.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Prose>
        <Callout tone="notice" title="What is explicitly avoided" className="mt-6">
          &ldquo;Pay us and we&rsquo;ll remove your report.&rdquo; A pay-to-remove scheme is not
          simply disfavoured — it is structurally impossible, because removal is only possible through
          the processes defined in <a href="/moderation" className="font-medium text-official-mid underline underline-offset-2">moderation</a> and{" "}
          <a href="/privacy" className="font-medium text-official-mid underline underline-offset-2">privacy</a>. There is no price at which a report or statistic changes. The
          same logic extends to monetising individual allegations: the platform publishes aggregates,
          not accusations, and does not sell prominence, placement, or favourable treatment.
        </Callout>
      </DocSection>

      <DocSection
        id="data"
        title="Where governance meets the data"
        lead="Governance is not an appendix to the project; it is load-bearing."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              The <strong>status ladder</strong> and publishing threshold in the{" "}
              <a href="/methodology">methodology</a> are the data-side expression of the governance
              rules — they decide what counts as a fact.
            </li>
            <li>
              The <strong>moderation log</strong> and escalation path in{" "}
              <a href="/moderation">moderation</a> are the enforcement arm.
            </li>
            <li>
              The <strong>privacy guarantees</strong> in <a href="/privacy">privacy</a> are the
              boundary conditions every role operates within.
            </li>
          </ul>
          <p>
            If the website disappears, governance survives in the mirrorable artifacts: the open code,
            the dataset exports, the methodology, and the documented roles any successor community can
            adopt.
          </p>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/methodology">The methodology</ActionLink>
          <ActionLink href="/mirroring">How to mirror the project</ActionLink>
          <ActionLink href="/contribute">Become a contributor</ActionLink>
        </div>
      </DocSection>
    </DocLayout>
  );
}
