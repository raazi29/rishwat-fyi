import type { Metadata } from "next";

import { ActionLink } from "@/components/ui";
import {
  CodeBlock,
  DefinitionList,
  DocLayout,
  DocSection,
  Prose,
  type TableOfContentsItem,
} from "@/components/doc";

import { COLUMN_GROUPS, NEVER_EXPORTED } from "./_data/columns";

export const metadata: Metadata = {
  title: "Data dictionary",
  description:
    "Every column in the public Rishwat.fyi reports dataset — name, type, unit, nullability, privacy class and description — grouped by entity, plus the fields that are never exported and the JSON and CSV formats.",
  alternates: { canonical: "/data/dictionary" },
};

const TOC: TableOfContentsItem[] = [
  { id: "scope", label: "Dataset scope" },
  { id: "license", label: "License" },
  { id: "redaction", label: "Redaction policy" },
  { id: "never-exported", label: "Never exported" },
  { id: "formats", label: "Formats" },
  {
    id: "columns",
    label: "Column reference",
    children: COLUMN_GROUPS.map((group) => ({ id: group.id, label: group.title, level: 3 as const })),
  },
  { id: "stability", label: "Stability" },
];

const JSON_EXAMPLE = `[
  {
    "public_id": "R-a1b2c3d4",
    "service_slug": "driving-licence",
    "service_name": "Driving Licence",
    "department": "Transport",
    "state_code": "UP",
    "state_name": "Uttar Pradesh",
    "district_name": "Agra",
    "period_start": "2026-05-01",
    "period_end": "2026-05-31",
    "official_fee_reported_inr": "600.00",
    "additional_amount_reported_inr": "1500.00",
    "amount_paid_inr": "2100.00",
    "paid": true,
    "delay_days": 45,
    "visits": 3,
    "redacted_description": "Had to pay extra to the agent. Contact [REDACTED] for details.",
    "status": "validated",
    "created_at": "2026-06-02T10:15:00.000Z"
  }
]`;

const CSV_EXAMPLE = `public_id,service_slug,service_name,department,state_code,...
R-a1b2c3d4,driving-licence,Driving Licence,Transport,UP,...`;

export default function DataDictionaryPage() {
  return (
    <DocLayout
      title="Data dictionary"
      lead="The human-readable form of the dataset contract: one row per published report, eighteen columns, and exactly what each one means. When this and the OpenAPI spec disagree, this document is authoritative for dataset semantics."
      toc={TOC}
      sourcePath="docs/data-dictionary.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Data", href: "/data" }, { label: "Dictionary" }]}
    >
      <DocSection
        id="scope"
        title="Dataset scope"
        lead="The dataset contains one row per published report. A report is exported only when its status is one of four publishable states."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <code>validated</code> — reviewed by a moderator and kept.
            </li>
            <li>
              <code>corroborated</code> — auto-corroborated by ≥ 2 independent reports (distinct
              IP-hash buckets, same service and district, last 180 days).
            </li>
            <li>
              <code>evidence_backed</code> — corroborated and accepted evidence attached.
            </li>
            <li>
              <code>officially_acknowledged</code> — official response acknowledged by a moderator.
            </li>
          </ul>
          <p>
            Excluded: <code>submitted</code> (not yet moderated), <code>rejected</code> (moderated
            out), and <code>withdrawn</code>. See the <a href="/methodology">methodology</a> for the
            status ladder and the publishing-threshold rules for aggregates.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="license" title="License">
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Data (the exported rows):</strong> CC BY 4.0 — attribution required.
            </li>
            <li>
              <strong>Code (schemas, exports, and everything in the repository):</strong> MIT.
            </li>
          </ul>
          <p>Licensing is provisional and not yet finalised.</p>
        </Prose>
      </DocSection>

      <DocSection
        id="redaction"
        title="Redaction policy"
        lead="The redacted_description column is the raw description passed through the redactor before export."
      >
        <Prose className="prose-measure">
          <p>It deterministically replaces each of the following with the literal token <code>[REDACTED]</code>:</p>
          <ul>
            <li>Aadhaar numbers (12 digits)</li>
            <li>Indian mobile numbers (10 digits, optional +91 prefix)</li>
            <li>Email addresses</li>
            <li>16-digit card numbers</li>
          </ul>
          <p>
            Redaction order matters (email patterns are matched before phone patterns) and is applied
            on every export — the raw description is never exported. See the{" "}
            <a href="/privacy">privacy policy</a> for the full do-not-publish list.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="never-exported"
        title="Fields that are never exported"
        lead="These columns exist for abuse detection and tracking but are never present in any export, CSV, or JSON response — not redacted, absent by construction."
      >
        <DefinitionList items={NEVER_EXPORTED} />
      </DocSection>

      <DocSection id="formats" title="Formats" lead="Both exports are served with Cache-Control: no-store.">
        <Prose className="prose-measure">
          <h3>JSON (reports.json)</h3>
          <p>
            A JSON array of objects, one per report. Keys match the column names exactly. Money values
            are decimal strings, never floats, to preserve the exact <code>numeric(12,2)</code>{" "}
            precision.
          </p>
        </Prose>
        <CodeBlock code={JSON_EXAMPLE} label="reports.json" ariaLabel="Example reports.json row" />
        <Prose className="prose-measure mt-6">
          <h3>CSV (reports.csv)</h3>
          <p>
            A single header row followed by one row per report, quoted per RFC 4180. Column order is
            exactly the order of the reference below.
          </p>
        </Prose>
        <CodeBlock code={CSV_EXAMPLE} label="reports.csv" ariaLabel="Example reports.csv header and row" />
      </DocSection>

      <DocSection
        id="columns"
        title="Column reference"
        lead="Eighteen columns, in export order, grouped by what they describe."
      >
        <div className="space-y-10">
          {COLUMN_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 id={group.id} className="scroll-mt-24 font-sans text-h3 font-semibold text-ink">
                {group.title}
              </h3>
              <DefinitionList items={group.items} className="mt-4" />
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="stability"
        title="Stability"
        lead="The column names, order and types here are the contract with the export service and are covered by tests."
      >
        <Prose className="prose-measure">
          <p>
            Any change to the export projection must be made in the export service, reflected here,
            and updated in the OpenAPI spec served at <code>/doc/openapi.json</code>. That is what lets
            a mirror regenerate and verify the dataset independently.
          </p>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/data">Download the dataset</ActionLink>
          <ActionLink href="/data/api">The API reference</ActionLink>
          <ActionLink href="/mirroring">Mirror the dataset</ActionLink>
        </div>
      </DocSection>
    </DocLayout>
  );
}
