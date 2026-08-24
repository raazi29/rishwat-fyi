import type { Metadata } from "next";

import { ActionLink } from "@/components/ui";
import {
  CodeBlock,
  DocLayout,
  DocSection,
  DocTable,
  Prose,
  ThresholdCallout,
  type TableOfContentsItem,
} from "@/components/doc";
import { ArticleJsonLd, BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { MANDATORY_NOTICE } from "@/components/ui/callout";

import { StatusLadder } from "./_components/status-ladder";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Rishwat.fyi turns anonymous citizen reports into public statistics — the verification ladder, the publishing threshold, the aggregate definitions, the anti-abuse system, and the honest limitations of the data.",
  alternates: { canonical: "/methodology" },
};

const TOC: TableOfContentsItem[] = [
  { id: "core-loop", label: "The core loop" },
  { id: "ladder", label: "Report status ladder" },
  { id: "threshold", label: "Publishing threshold" },
  { id: "aggregates", label: "Aggregate definitions" },
  { id: "anti-abuse", label: "Anti-abuse" },
  { id: "limitations", label: "Data limitations" },
  { id: "reproducibility", label: "Reproducibility" },
];

export default function MethodologyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Methodology", url: "/methodology" },
        ]}
      />
      <ArticleJsonLd
        headline="Methodology — How citizen reports become public statistics"
        description="The verification ladder, publishing threshold, aggregate definitions, anti-abuse system, and honest limitations behind Rishwat.fyi public data."
        url="/methodology"
      />
      <FaqJsonLd
        items={[
          {
            question: "What is the publishing threshold?",
            answer: "A statistic publishes only when a (service, district) cell has ≥3 reports from ≥2 distinct IP-hash buckets. Below that every statistic is null while the count still shows.",
          },
          {
            question: "How is a report verified?",
            answer: "Reports climb submitted → validated → corroborated → evidence_backed → officially_acknowledged. Corroborated requires ≥2 independent reports; evidence-backed adds accepted evidence; officially acknowledged adds a government source.",
          },
          {
            question: "How are abuse and fakes handled?",
            answer: "Rate limits, text similarity ≥0.75 duplicate detection, IP/device signals, coordinated burst detection, and an abuse score capped at 100. Flagged reports stay for human moderation.",
          },
          {
            question: "What does the mandatory notice mean?",
            answer: "Citizen reports represent reported experiences and are not automatically verified findings of wrongdoing. Extremes cannot skew medians because aggregates use medians, not means.",
          },
        ]}
      />
      <DocLayout
      title="Methodology"
      lead="How Rishwat.fyi turns anonymous citizen reports into public statistics — and what it refuses to claim. That measurement only means something if the method behind it is published, repeatable, and honest about its limits. This document is that method."
      toc={TOC}
      sourcePath="docs/methodology.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Methodology" }]}
    >
      <DocSection id="core-loop" title="The core loop">
        <Prose className="prose-measure">
          <p>
            Rishwat.fyi measures the gap between how a government service is{" "}
            <strong>officially</strong> supposed to work and how citizens{" "}
            <strong>actually experience</strong> it. Each stage of the loop feeds the next: a
            citizen&rsquo;s experience becomes a structured report; the report is verified; verified
            reports accumulate into aggregate patterns; only those patterns — never individual
            reports — become public statistics.
          </p>
        </Prose>
        <CodeBlock
          code="Official procedure  →  Citizen experience  →  Structured report  →  Verification  →  Aggregate pattern  →  Public data"
          label="The core loop"
          copy={false}
          ariaLabel="The core loop, from official procedure to public data"
        />
      </DocSection>

      <DocSection
        id="ladder"
        title="Report status ladder"
        lead="A report does not become a fact by being submitted. It climbs a ladder as independent evidence accumulates."
      >
        <StatusLadder />
        <Prose className="prose-measure mt-6">
          <p>The only valid forward transitions are:</p>
        </Prose>
        <CodeBlock
          code="submitted → validated → corroborated → evidence_backed → officially_acknowledged"
          label="Valid forward transitions"
          copy={false}
          ariaLabel="Valid forward transitions between report statuses"
        />
        <Prose className="prose-measure mt-4">
          <p>
            <code>rejected</code> and <code>withdrawn</code> are <strong>terminal</strong> states:
            they can be reached from any non-terminal state, but nothing moves out of them.{" "}
            <code>rejected</code> means the report failed moderation; <code>withdrawn</code> means it
            was removed at the reporter&rsquo;s request or by process. Every transition is recorded in{" "}
            <code>verification_events</code>, so the provenance of a report&rsquo;s status is always
            auditable.
          </p>
          <ul>
            <li>
              <strong>Corroborated</strong> is normally reached automatically: a validated report
              with at least two other independent reports (distinct IP hashes) for the same service
              and district within the last 180 days is corroborated via <code>auto_corroboration</code>.
            </li>
            <li>
              <strong>Evidence-backed</strong> requires a human decision: accepted evidence{" "}
              <em>plus</em> a validated report.
            </li>
            <li>
              <strong>Officially acknowledged</strong> requires a moderator decision backed by a
              government source URL.
            </li>
          </ul>
          <p>
            The review side of these transitions is described in{" "}
            <a href="/moderation">the moderation workflow</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="threshold"
        title="Publishing threshold"
        lead="The single most important rule: one dramatic report should never determine a public statistic."
      >
        <ThresholdCallout />
        <Prose className="prose-measure mt-6">
          <p>
            A statistic for a (service, district) cell is published only when the source report set —
            reports with status <code>validated</code>, <code>corroborated</code>,{" "}
            <code>evidence_backed</code> or <code>officially_acknowledged</code> — contains at least
            three reports, from at least two distinct IP-hash buckets, all within the same (service,
            district) cell.
          </p>
          <p>
            If either condition is not met, the published statistic for that cell is <code>null</code>.
            The raw report count is still returned with <code>published: false</code>, so the public
            can see <em>how much (or how little) data exists</em> behind a &ldquo;no signal&rdquo;
            result. The IP-bucket requirement exists precisely so that one person, one office, or one
            coordinated group cannot manufacture a statistic on their own.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="aggregates"
        title="Aggregate definitions"
        lead="Within a publishable cell, aggregates are computed over the publishable report set. All money is stored and computed as numeric(12,2) INR — never floats."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Median extra payment</strong> — <code>percentile_cont(0.5)</code> of{" "}
              <code>additional_amount_reported_inr</code>, the amount reportedly requested on top of
              the official fee. A median, not a mean, so a single extreme claim cannot skew the
              number.
            </li>
            <li>
              <strong>Median delay</strong> — <code>percentile_cont(0.5)</code> of{" "}
              <code>delay_days</code>.
            </li>
            <li>
              <strong>Average visits</strong> — <code>avg(visits)</code> across reports.
            </li>
            <li>
              <strong>Corroboration rate</strong> — the fraction of reports in the cell at{" "}
              <code>corroborated</code>, <code>evidence_backed</code> or{" "}
              <code>officially_acknowledged</code>, used as a reliability measure alongside the report
              count.
            </li>
            <li>
              <strong>Verification rate, evidence-backed rate and report freshness</strong> —
              tracked as reliability metrics and reported where the dataset supports them.
            </li>
          </ul>
          <h3>Derived issue signals</h3>
          <p>
            Beyond the headline numbers, each service page reports common friction points derived
            from report descriptions. Descriptions in the cell are scanned for five canonical issue
            keywords, and the top keywords by count are shown — derived from real descriptions, not
            seeded or random:
          </p>
        </Prose>
        <CodeBlock
          code={
            "multiple_visits\nunclear_process\nadditional_payment_requested\ndocument_requests_repeated\noffice_staff_unhelpful"
          }
          label="Canonical issue keywords"
          copy={false}
          ariaLabel="The five canonical issue keywords"
        />
        <Prose className="mt-6">
          <p>
            The exact column names, types and units behind every aggregate are set out in the{" "}
            <a href="/data/dictionary">data dictionary</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="anti-abuse"
        title="Anti-abuse"
        lead="Rishwat.fyi will attract fake reports, coordinated attacks, duplicates and personal disputes. Anti-abuse is a first-class system, not a bolt-on — and every automated signal ends in a human decision."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Rate limiting</strong> — strict per-IP limits on report submission, evidence
              upload and admin login.
            </li>
            <li>
              <strong>Duplicate detection</strong> — text similarity (<code>similarity() ≥ 0.75</code>{" "}
              within 90 days for the same service and district) links near-identical submissions into
              a <code>duplicate_group_id</code>.
            </li>
            <li>
              <strong>IP and device signals</strong> — hashed IP and device-fingerprint counts;
              repeated submissions from the same source within 24 hours add to an abuse score.
            </li>
            <li>
              <strong>Coordinated clusters</strong> — at least 3 reports for the same service and
              district with similarity ≥ 0.5 within one hour, or at least 5 reports from one IP-hash
              bucket in a window, trigger cluster flags.
            </li>
            <li>
              <strong>Human moderation</strong> — flagged reports stay in the queue for a moderator;
              a high score never quietly deletes a report, it surfaces it for review.
            </li>
          </ul>
          <p>Reports accumulate an abuse score, capped at 100:</p>
        </Prose>
        <DocTable
          className="mt-4"
          caption="Abuse score signals and their point values"
          columns={[
            { key: "signal", header: "Signal", primary: true },
            { key: "points", header: "Points", align: "right" },
          ]}
          rows={[
            { signal: "Duplicate of an existing report", points: "+40" },
            { signal: "More than 5 reports from one IP hash in 24 hours", points: "+30" },
            { signal: "More than 5 reports from one device fingerprint in 24 hours", points: "+20" },
            { signal: "Coordinated burst", points: "+50" },
          ]}
        />
        <Prose className="prose-measure mt-6">
          <p>
            A score of 70 or more keeps the report at <code>submitted</code> and records an{" "}
            <code>auto_flag</code> verification event (<code>suspected_coordinated</code>); a
            moderator then decides. The consequence: published statistics are built only from reports
            that survived verification and represent independent sources — which is what makes them
            defensible.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="limitations"
        title="Data limitations"
        lead="Public data carries explicit limitations. The notice shown on every service page applies to every statistic and dataset."
      >
        <Prose className="prose-measure">
          <blockquote>{MANDATORY_NOTICE}</blockquote>
          <p>In addition:</p>
          <ul>
            <li>
              Aggregates reflect <strong>what was reported</strong>, not a census of all experiences
              with a service. Non-response and access bias mean the true distribution may differ.
            </li>
            <li>
              Only reports that passed verification and met the publishing threshold appear in public
              statistics; below-threshold cells are <code>null</code> by design.
            </li>
            <li>
              Reported amounts, delays and visits are <strong>unverified claims</strong> unless the
              report is <code>evidence_backed</code> or <code>officially_acknowledged</code> — and
              even then they describe individual experiences, not legal findings.
            </li>
            <li>
              Aggregates are specific to the (service, district) cell they describe; they must not be
              read as statements about a department, an office, or any individual.
            </li>
            <li>We do not name or accuse individuals. The platform measures patterns, not guilt.</li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection
        id="reproducibility"
        title="Reproducibility and licensing"
        lead="The method is open so anyone can recompute the figures and audit the trail behind any published number."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Licence.</strong> Dataset exports are licensed <strong>CC BY 4.0</strong>; code
              is <strong>MIT</strong>. Individual files carry their own attribution. Licensing is
              provisional and not yet finalised.
            </li>
            <li>
              <strong>Reproducibility.</strong> This methodology, the{" "}
              <a href="/data/dictionary">data dictionary</a>, the schemas and the export scripts are
              all open source and version-controlled, so anyone can recompute published figures.
            </li>
            <li>
              <strong>Auditability.</strong> Every status change is recorded in{" "}
              <code>verification_events</code> and every moderator decision in{" "}
              <code>moderation_actions</code> (see <a href="/moderation">moderation</a>); the history
              behind any published number can be traced.
            </li>
          </ul>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/data/dictionary">Read the data dictionary</ActionLink>
          <ActionLink href="/moderation">How reports are reviewed</ActionLink>
          <ActionLink href="/data">Get the open dataset</ActionLink>
        </div>
      </DocSection>
      </DocLayout>
    </>
  );
}
