import type { Metadata } from "next";

import { ActionLink, ButtonLink, SampleDataStrip } from "@/components/ui";
import { DownloadIcon } from "@/components/icons";
import { CodeBlock, DocLayout, DocSection, DocTable, Prose, type TableOfContentsItem } from "@/components/doc";
import { datasetDownloadUrl, getDatasetIndex } from "@/lib/api";

export const metadata: Metadata = {
  title: "Mirroring the data",
  description:
    "If transparency depends on one website staying online, it isn't really transparent. How to run an independent mirror of the Rishwat.fyi dataset — from the live exports, from source, or the whole project.",
  alternates: { canonical: "/mirroring" },
};

const TOC: TableOfContentsItem[] = [
  { id: "mirrorable", label: "What is mirrorable" },
  { id: "license", label: "License" },
  { id: "how", label: "How to mirror" },
  { id: "manifest", label: "The mirror manifest" },
  { id: "independence", label: "Independence guarantees" },
  { id: "quality", label: "Data quality note" },
];

const EXPORT_FROM_SOURCE = `git clone <repository-url>
cd rishwat-fyi
npm install
cp .env.example .env          # set DATABASE_URL, TEST_DATABASE_URL, JWT_SECRET
bash scripts/db-up.sh
npm run db:migrate
npm run db:seed
npm run export -w apps/api    # writes data/exports/reports-<YYYY-MM-DD>.csv/.json + manifest.json`;

const MANIFEST = `{
  "generated_at": "2026-08-20T00:00:00.000Z",
  "counts": { "reports": 1243 },
  "schema_version": "1.0",
  "files": [
    "reports-2026-08-20.csv",
    "reports-2026-08-20.json"
  ]
}`;

export default async function MirroringPage() {
  const index = await getDatasetIndex();
  const datasets = index.data.datasets;

  const fetchCommands = datasets
    .map((entry) => `curl -o ${entry.name}.${entry.format} ${datasetDownloadUrl(entry.name, entry.format)}`)
    .join("\n");

  const cronCommands = [
    "# crontab — fetch fresh snapshots hourly",
    ...datasets.map(
      (entry) =>
        `0 * * * *  curl -fsS ${datasetDownloadUrl(entry.name, entry.format)} -o /var/www/mirror/${entry.name}.${entry.format}`,
    ),
  ].join("\n");

  return (
    <DocLayout
      title="Mirroring the data"
      lead="The most important architectural principle of Rishwat.fyi is that the platform must not depend on one website. Everything that makes the data meaningful is public and mirrorable, so the project survives any single point of failure."
      toc={TOC}
      sourcePath="docs/mirroring.md"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Data", href: "/data" }, { label: "Mirroring" }]}
      intro={
        <>
          {index.source === "sample" ? (
            <SampleDataStrip reason={index.reason?.message} className="mt-6" />
          ) : null}
          <blockquote className="prose-measure mt-6 border-l border-official-soft pl-4 font-serif text-body-lg text-ink">
            Website A disappears → Mirror B continues → Dataset C survives → Fork D continues
            development.
          </blockquote>
        </>
      }
    >
      <DocSection
        id="mirrorable"
        title="What is mirrorable"
        lead="The project publishes, without authentication, everything a mirror needs."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Dataset snapshots</strong> — CSV and JSON exports of all published reports.
            </li>
            <li>
              <strong>A dataset manifest</strong> — machine-readable metadata (<code>generated_at</code>,{" "}
              <code>counts</code>, <code>schema_version</code>) published alongside every export.
            </li>
            <li>
              <strong>The public API</strong> — documented in the{" "}
              <a href="/data/api">API reference</a> and machine-readable at <code>/doc/openapi.json</code>.
            </li>
            <li>
              <strong>The schemas</strong> — the report schema and the{" "}
              <a href="/data/dictionary">data dictionary</a>.
            </li>
            <li>
              <strong>The source code</strong> — the full repository, including the methodology,
              moderation rules and seed data.
            </li>
            <li>
              <strong>This documentation</strong> — every <code>docs/</code> file.
            </li>
          </ul>
          <p>
            Nothing a mirror needs is behind a login. The dataset endpoints are served with{" "}
            <code>Cache-Control: no-store</code> so mirrors can always fetch fresh copies.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="license" title="License">
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>Dataset rows (the exports):</strong> CC BY 4.0 — attribution required. Mirrors
              may republish the data as long as they credit the source.
            </li>
            <li>
              <strong>Code and schemas:</strong> MIT — mirrors and forks may reuse, modify, and
              redistribute freely.
            </li>
          </ul>
          <p>Licensing is provisional and not yet finalised; treat it as such rather than as settled.</p>
        </Prose>
      </DocSection>

      <DocSection
        id="how"
        title="How to mirror"
        lead="Three routes, from the simplest fetch to a full independent fork."
      >
        <Prose className="prose-measure">
          <h3>Option A — mirror the live exports (simplest)</h3>
          <p>
            The dataset is available over plain HTTPS with no auth. The current snapshot lives at:
          </p>
          <ul>
            {datasets.map((entry) => (
              <li key={`${entry.name}.${entry.format}`}>
                <a href={datasetDownloadUrl(entry.name, entry.format)} target="_blank" rel="noreferrer noopener">
                  {datasetDownloadUrl(entry.name, entry.format)}
                </a>{" "}
                <span className="text-ink-muted">({entry.format.toUpperCase()})</span>
              </li>
            ))}
          </ul>
        </Prose>
        <div className="mt-4 flex flex-wrap gap-3">
          {datasets.map((entry) => (
            <ButtonLink
              key={`${entry.name}-${entry.format}`}
              href={datasetDownloadUrl(entry.name, entry.format)}
              external
              variant="secondary"
              iconLeading={<DownloadIcon size={18} />}
            >
              {entry.name}.{entry.format}
            </ButtonLink>
          ))}
        </div>
        <Prose className="prose-measure mt-6">
          <p>Fetch the current snapshot and re-serve it as static files:</p>
        </Prose>
        <CodeBlock code={fetchCommands} label="Fetch the current snapshot" ariaLabel="Commands to fetch the current dataset snapshot" />
        <Prose className="prose-measure mt-6">
          <p>
            Host the files on any static host (GitHub Pages, Netlify, Cloudflare Pages/R2, an
            S3-compatible bucket, or a plain nginx/Apache directory). To keep a mirror current,
            schedule a periodic fetch, and preserve the manifest so readers can see when the snapshot
            was generated:
          </p>
        </Prose>
        <CodeBlock code={cronCommands} label="crontab" ariaLabel="Cron entries to keep a mirror current" />

        <Prose className="prose-measure mt-8">
          <h3>Option B — generate your own exports from source</h3>
          <p>
            A mirror can produce the dataset independently from the code, so it does not depend on the
            live API at all. The export script runs the same query the API uses, applies the same
            redaction, and writes a manifest next to the files:
          </p>
        </Prose>
        <CodeBlock code={EXPORT_FROM_SOURCE} label="Generate exports from source" ariaLabel="Commands to generate dataset exports from source" />

        <Prose className="prose-measure mt-8">
          <h3>Option C — mirror the whole project</h3>
          <p>
            For maximum independence, mirror the repository itself (a plain <code>git clone</code>, or
            a fork on a code host) plus the exported datasets. That gives future contributors the
            code, the schemas, the seed data, and a current snapshot — everything needed to stand up a
            new instance.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="manifest"
        title="The mirror manifest"
        lead="Every export is accompanied by a manifest.json describing what was produced — the standard way for mirrors to tell readers when a snapshot was generated and what it contains."
      >
        <CodeBlock code={MANIFEST} label="manifest.json" ariaLabel="Example mirror manifest" />
        <DocTable
          className="mt-6"
          caption="Manifest fields"
          columns={[
            { key: "field", header: "Field", primary: true },
            { key: "meaning", header: "Meaning" },
          ]}
          rows={[
            { field: <code className="font-mono text-ink">generated_at</code>, meaning: "ISO 8601 UTC timestamp of when the snapshot was produced" },
            { field: <code className="font-mono text-ink">counts</code>, meaning: "Row counts per dataset (e.g. reports)" },
            { field: <code className="font-mono text-ink">schema_version</code>, meaning: "Version of the export schema, so consumers can detect breaking changes" },
            { field: <code className="font-mono text-ink">files</code>, meaning: "The export files included in this snapshot" },
          ]}
        />
        <Prose className="prose-measure mt-6">
          <p>
            Mirrors should publish their manifest at a stable, predictable URL (e.g.{" "}
            <code>/manifest.json</code>) so automated consumers can discover the latest snapshot and
            its <code>generated_at</code>.
          </p>
        </Prose>
      </DocSection>

      <DocSection
        id="independence"
        title="Independence guarantees"
        lead="What a mirror receives is exactly what the public API serves, and nothing more."
      >
        <Prose className="prose-measure">
          <ul>
            <li>
              <strong>No PII by construction.</strong> Exports are built from an explicit allowlist of
              columns. IP hashes, device fingerprints, submission-token hashes and office identifiers
              are structurally excluded — never selected, not merely redacted.
            </li>
            <li>
              <strong>Only published reports.</strong> Exports contain only reports in publishable
              statuses; <code>submitted</code>, <code>rejected</code> and <code>withdrawn</code> reports
              never appear.
            </li>
            <li>
              <strong>Descriptions are redacted.</strong> The <code>redacted_description</code> column
              has Aadhaar, mobile numbers, emails and card numbers replaced before export.
            </li>
            <li>
              <strong>No authentication required.</strong> A mirror never depends on credentials or on
              a specific operator&rsquo;s goodwill.
            </li>
            <li>
              <strong>Reproducible.</strong> Because the schema, methodology, redaction code and export
              scripts are open source, a mirror can regenerate and verify the dataset independently.
            </li>
            <li>
              <strong>Survival.</strong> A read-only copy cannot be censored, quietly erased, or taken
              offline by pressure on the original operator. That is the point.
            </li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection
        id="quality"
        title="Data quality note for mirrors"
        lead="Please reproduce the notice from the methodology when serving mirrored data."
      >
        <Prose className="prose-measure">
          <blockquote>{index.data.notice}</blockquote>
          <p>
            And remember the limitations in the <a href="/methodology">methodology</a>: aggregates
            reflect what was reported, not a census; below-threshold cells are <code>null</code> by
            design; and the dataset measures patterns and experiences, not guilt.
          </p>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/data">The open-data hub</ActionLink>
          <ActionLink href="/data/dictionary">The data dictionary</ActionLink>
          <ActionLink href="/data/api">The API reference</ActionLink>
        </div>
      </DocSection>
    </DocLayout>
  );
}
