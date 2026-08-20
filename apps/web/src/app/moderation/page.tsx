import type { Metadata } from "next";

import { ActionLink } from "@/components/ui";
import { DocLayout, DocSection, DocTable, Prose, type TableOfContentsItem } from "@/components/doc";

export const metadata: Metadata = {
  title: "Moderation",
  description:
    "How citizen reports move through human review: the moderation queue, the decision actions, evidence review, the audit log, the escalation path for difficult cases, and the legal framing behind it all.",
  alternates: { canonical: "/moderation" },
};

const TOC: TableOfContentsItem[] = [
  { id: "queue", label: "The moderation queue" },
  { id: "decisions", label: "Decision actions" },
  { id: "evidence", label: "Evidence review" },
  { id: "logs", label: "Log transparency" },
  { id: "escalation", label: "Escalation" },
  { id: "legal", label: "Legal framing" },
];

export default function ModerationPage() {
  return (
    <DocLayout
      title="Moderation"
      lead="Moderation is the layer that separates an allegation from a verified fact. No report becomes public data — or part of any published statistic — without passing through it."
      toc={TOC}
      sourcePath="docs/moderation.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Moderation" }]}
    >
      <DocSection id="queue" title="The moderation queue">
        <Prose className="prose-measure">
          <p>
            Moderators work from a queue. It lists pending reports, oldest first, with the
            report&rsquo;s service and district names, how many evidence files it has, its current
            status (filterable), and its abuse signals where present.
          </p>
          <p>
            Reports enter the queue in status <code>submitted</code>. A report that fails
            verification — spam, fabricated, coordinated or otherwise — is rejected; a report that
            passes basic quality and spam checks is validated. The status model these actions operate
            on is defined in the <a href="/methodology">methodology</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="decisions"
        title="Decision actions"
        lead="A moderator acts on a report through one of four actions. Each is a legal state transition enforced by the verification state machine."
      >
        <DocTable
          caption="Moderation decision actions"
          columns={[
            { key: "action", header: "Action", primary: true },
            { key: "target", header: "Target status" },
            { key: "notes", header: "Notes" },
          ]}
          rows={[
            {
              action: <code className="font-mono text-ink">mark_validated</code>,
              target: <code className="font-mono">validated</code>,
              notes: "Basic spam and quality checks passed; transition method moderator_review.",
            },
            {
              action: <code className="font-mono text-ink">reject</code>,
              target: <code className="font-mono">rejected</code>,
              notes: "Terminal. Requires a reason.",
            },
            {
              action: <code className="font-mono text-ink">acknowledge_officially</code>,
              target: <code className="font-mono">officially_acknowledged</code>,
              notes:
                "Requires a source_url — a government authority or official source acknowledging the underlying issue. Rejected with 400 if none is supplied.",
            },
            {
              action: <code className="font-mono text-ink">withdraw</code>,
              target: <code className="font-mono">withdrawn</code>,
              notes: "Terminal. Removed at the reporter's request or by process.",
            },
          ]}
        />
        <Prose className="prose-measure mt-6">
          <p>
            Every decision records a row in <code>moderation_actions</code> with the acting
            moderator&rsquo;s ID and the stated reason — there is no way to change a report&rsquo;s
            status silently. Illegal transitions (for example, rejecting an already-rejected report)
            return a 400.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="evidence"
        title="Evidence review"
        lead="Evidence is reviewed separately from the report itself. Files are uploaded in status pending_review and held for a limited retention window."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Accepted</strong> — the file is genuine and relevant.
            </li>
            <li>
              <strong>Rejected</strong> — the file is fabricated, irrelevant, or contains material
              that cannot be published.
            </li>
          </ul>
          <p>The rule that turns evidence into trust:</p>
          <blockquote>Accepted evidence + a validated report → evidence_backed</blockquote>
          <p>
            Evidence is only ever used to promote a report after a human has accepted it and the
            report itself is already validated. Evidence review is recorded in{" "}
            <code>verification_events</code> with method <code>evidence_review</code>, so the link
            between a file and the status it supported is always traceable. The retention window and
            deletion rule are set out in <a href="/privacy">the privacy policy</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="logs"
        title="Moderation log transparency"
        lead="Two tables carry the audit trail, and both are part of the public methodology contract."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <code>verification_events</code> — every status transition, automated or human: who (if
              human), what method (<code>citizen_submission</code>, <code>moderator_review</code>,{" "}
              <code>auto_corroboration</code>, <code>evidence_review</code>, <code>auto_flag</code>,
              …), when, and from and to which status.
            </li>
            <li>
              <code>moderation_actions</code> — every moderator decision: which moderator, which
              report, which action, the reason, and the timestamp.
            </li>
          </ul>
          <p>
            Together they mean the history behind any published number can be reconstructed. This is
            deliberate: moderation must itself be accountable.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="escalation"
        title="Escalation: difficult cases"
        lead="When a case is genuinely hard — ambiguous evidence, borderline legality, conflicting reports, sensitive subject matter — a single moderator should not be the last word."
      >
        <Prose className="prose-measure">
          <ol>
            <li>
              The case is flagged in the queue by any moderator; the initial moderator&rsquo;s
              decision and reasoning stay in the log.
            </li>
            <li>
              It goes to <strong>independent reviewers</strong> — a standing, volunteer group separate
              from the technical maintainers and from any single government department or political
              party.
            </li>
            <li>
              The reviewers examine the report, its evidence and its verification history, and return
              a recommendation. The decision (accept, reject or hold) is recorded like any other{" "}
              <code>moderation_actions</code> row.
            </li>
          </ol>
          <p>
            Independent reviewers exist specifically so that governance does not depend on one
            person&rsquo;s judgment — see <a href="/governance">the governance model</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="legal"
        title="Legal framing"
        lead="Moderation operates inside a consistent legal posture."
      >
        <Prose className="prose-measure">
          <ol>
            <li>
              <strong>Separate allegation from verified fact.</strong> A submitted or even validated
              report is an allegation; only evidence-backed and officially acknowledged statuses carry
              the weight of verification, and even those describe experiences, not findings of
              wrongdoing.
            </li>
            <li>
              <strong>Provide a clear correction process.</strong> Reporters may correct or withdraw
              their own reports, and any published figure shown to be wrong is corrected publicly —
              the correction is itself a moderation action.
            </li>
            <li>
              <strong>Avoid publishing unnecessary personal data.</strong> Nothing in the public view,
              exports, or statistics may contain identifying information. The{" "}
              <a href="/privacy">redaction pipeline and do-not-publish list</a> are enforced at
              ingestion and again at export.
            </li>
            <li>
              <strong>Maintain moderation logs</strong> and <strong>preserve evidence</strong> of
              moderation decisions — the two tables above.
            </li>
            <li>
              <strong>Publish the methodology</strong> and <strong>publish data-quality
              limitations</strong> — this document and the <a href="/methodology">methodology</a>.
            </li>
            <li>
              <strong>Avoid monetising individual allegations</strong> and{" "}
              <strong>avoid pay-to-remove systems.</strong> No one can pay to have a report removed or
              a statistic changed; the only removal paths are the process defined here.
            </li>
            <li>
              <strong>Keep governance independent</strong> from individual political parties and
              government departments — including through the independent-reviewer escalation path
              above.
            </li>
          </ol>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/methodology">The status model and thresholds</ActionLink>
          <ActionLink href="/privacy">Privacy and redaction</ActionLink>
          <ActionLink href="/governance">Governance and funding</ActionLink>
        </div>
      </DocSection>
    </DocLayout>
  );
}
