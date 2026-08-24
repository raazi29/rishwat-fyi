import type { Metadata } from "next";

import { ActionLink, Callout } from "@/components/ui";
import { CodeBlock, DocLayout, DocSection, Prose, type TableOfContentsItem } from "@/components/doc";
import { ArticleJsonLd, BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { EyeOffIcon, LockIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Privacy is a foundational feature, not a legal afterthought. What Rishwat.fyi never collects, what it hashes, how the one-time reporter token works, the 90-day evidence retention rule, the redaction pipeline, and the do-not-publish list.",
  alternates: { canonical: "/privacy" },
};

const TOC: TableOfContentsItem[] = [
  { id: "minimal", label: "Minimal collection" },
  { id: "hashing", label: "Hashing identifiers" },
  { id: "token", label: "The reporter's token" },
  { id: "retention", label: "Evidence retention" },
  { id: "redaction", label: "The redaction pipeline" },
  { id: "do-not-publish", label: "Do-not-publish list" },
  { id: "correction", label: "Correction process" },
];

const NEVER_COLLECTED = [
  "Your name",
  "Your phone number",
  "Aadhaar",
  "PAN",
  "Any other government ID",
  "Your home address or exact location",
];

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Privacy", url: "/privacy" }]} />
      <ArticleJsonLd headline="Privacy — Minimal data collection and protection" description="What Rishwat.fyi never collects, what it hashes, the one-time reporter token, 90-day evidence retention, redaction pipeline and do-not-publish list." url="/privacy" />
      <FaqJsonLd
        items={[
          {
            question: "What personal data does Rishwat.fyi never collect?",
            answer: "Name, phone number, Aadhaar, PAN, any government ID, home address or exact location — a report can be submitted without any identity at all.",
          },
          {
            question: "How are identifiers protected?",
            answer: "IP, device fingerprint and submission token are never stored raw — only their HMAC-SHA256 or SHA-256 digests. The database has no raw columns.",
          },
          {
            question: "What if I lose my report token?",
            answer: "Only the digest is stored, so the token cannot be re-issued. Lose it and you lose status lookup, but the report remains in aggregates anonymously.",
          },
          {
            question: "How long is evidence kept?",
            answer: "Evidence rows carry retention_until = now + 90 days and are auto-deleted from storage and metadata after expiry.",
          },
        ]}
      />
      <DocLayout
      title="Privacy"
      lead="Rishwat.fyi's value comes from aggregate patterns — what citizens as a group experience — not from identifying any individual. The whole system is built around minimal data collection: the smallest amount of information that can still produce a meaningful statistic, and then protection even for that."
      toc={TOC}
      sourcePath="docs/privacy.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
    >
      <DocSection
        id="minimal"
        title="Minimal data collection"
        lead="A report can be submitted without any identity at all."
      >
        <Callout tone="official" icon={<EyeOffIcon size={20} />} title="The platform never requires">
          <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
            {NEVER_COLLECTED.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-official-mid">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Callout>
        <Prose className="prose-measure mt-6">
          <p>
            The only data collected about a submitter is what is technically unavoidable for abuse
            control: an IP address, an optional device-fingerprint header, and a one-time submission
            token. All three are transformed before they touch the database, and the default posture
            remains minimal collection throughout.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="hashing"
        title="Hashing — never store raw identifiers"
        lead="Raw identifiers are never stored and never returned from any API. Each is replaced by a keyed one-way HMAC-SHA256 digest."
      >
        <CodeBlock
          code={
            "IP address          →  HMAC-SHA256 digest  (ip_hash)\nDevice fingerprint  →  HMAC-SHA256 digest  (device_fingerprint_hash)\nSubmission token    →  SHA-256 digest       (submission_token_hash)"
          }
          label="What is hashed"
          copy={false}
          ariaLabel="The three identifiers hashed to HMAC-SHA256 / SHA-256 digests"
        />
        <Prose className="prose-measure mt-6">
          <p>
            The database schema has no raw IP, fingerprint or token columns at all. Because the
            digests are one-way, they can only be used for the duplicate and abuse signals described
            in the <a href="/methodology">methodology</a> — they cannot be reversed into a person.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="token"
        title="The reporter's token"
        lead="The one thing a reporter must keep — and the one thing the platform deliberately cannot recover for them."
      >
        <Prose className="prose-measure">
          <p>
            On submission a reporter receives a <code>public_id</code> (in the form{" "}
            <code>R-xxxxxxxx</code>) and a one-time <code>submission_token</code>. The raw token is
            shown exactly once, at submission time, so the reporter can later check their
            report&rsquo;s status — only its SHA-256 digest is persisted.
          </p>
        </Prose>
        <Callout tone="notice" icon={<LockIcon size={20} />} title="Keep the token safe" className="mt-5">
          Because only the digest is stored, the token cannot be re-issued. Lose the token and you
          lose status lookup for that report. The report itself, and its contribution to the data,
          remain — but no one, including the platform, can tie it back to you.
        </Callout>
      </DocSection>

      <DocSection
        id="retention"
        title="Evidence retention — 90 days"
        lead="Evidence files are retained for a fixed, short window and then deleted automatically."
      >
        <CodeBlock
          code="retention_until = now + 90 days"
          label="Evidence retention rule"
          copy={false}
          ariaLabel="Evidence retention rule: retention_until equals now plus 90 days"
        />
        <Prose className="prose-measure mt-6">
          <p>
            Every evidence row carries a <code>retention_until</code> timestamp; files are deleted
            automatically after it expires, from both the storage backend and the metadata table.
            There is no indefinite evidence hoarding. Objects are stored in a private bucket and are
            never exposed through public endpoints.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="redaction"
        title="The redaction pipeline"
        lead="Evidence and descriptions may contain personal identifiers even when a reporter did not intend to share them. A deterministic redaction pipeline scans all free text before it can appear publicly or in exports."
      >
        <Prose className="prose-measure">
          <p>It replaces each of the following with the literal token <code>[REDACTED]</code>:</p>
          <ul>
            <li>Aadhaar numbers (12 digits)</li>
            <li>Indian mobile numbers (10 digits, optionally with a +91 prefix)</li>
            <li>Email addresses</li>
            <li>16-digit card numbers</li>
          </ul>
          <p>
            The pipeline is deterministic and order-sensitive (email patterns before phone patterns),
            and it runs both at ingestion and again at dataset export — so redaction holds even for
            material that enters through other paths.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="do-not-publish"
        title="The do-not-publish list"
        lead="The following are never published, in any dataset, API response, or statistic."
      >
        <Prose className="prose-measure">
          <ul>
            <li>Phone numbers</li>
            <li>Aadhaar numbers</li>
            <li>PAN</li>
            <li>Exact home addresses</li>
            <li>Personal email addresses</li>
            <li>Faces (in evidence)</li>
            <li>Personal documents containing sensitive information</li>
            <li>Names of alleged individuals, by default</li>
          </ul>
          <p>
            Dataset exports are constructed from an explicit allowlist of columns and structurally
            cannot include IP hashes, device hashes, submission-token hashes, or office identifiers —
            see <a href="/mirroring">mirroring</a> and the{" "}
            <a href="/data/dictionary">data dictionary</a>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="correction"
        title="Correction process"
        lead="Privacy extends to everyone who appears in a report — including the reporter."
      >
        <Prose className="prose-measure">
          <ol>
            <li>
              <strong>Withdrawal.</strong> A reporter who holds their submission token can request
              withdrawal. The status moves to <code>withdrawn</code> (terminal), and the report is
              excluded from all statistics and exports.
            </li>
            <li>
              <strong>Correction of published data.</strong> If a published figure is shown to be
              wrong — including because a report contained information that should have been redacted
              — the correction is made and recorded as a moderation action, so the change is visible
              in the audit trail rather than silent.
            </li>
            <li>
              <strong>No pay-to-remove.</strong> There is no paid removal path. Removal happens only
              through the processes in this document and in <a href="/moderation">moderation</a>.
            </li>
          </ol>
          <p>
            The privacy posture is not a settings screen; it is the shape of the database, the export
            pipeline, and the moderation rules. That is what makes it survivable — if the original
            team disappears, the data and the code that produced it preserve the same guarantees.
          </p>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/moderation">How corrections are recorded</ActionLink>
          <ActionLink href="/data/dictionary">What is and isn&rsquo;t in the data</ActionLink>
          <ActionLink href="/governance">Why there is no pay-to-remove</ActionLink>
        </div>
      </DocSection>
      </DocLayout>
    </>
  );
}
