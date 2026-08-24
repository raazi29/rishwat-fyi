import type { Metadata } from "next";
import Image from "next/image";

import { ActionLink, ButtonLink, NoticeStrip, SampleDataStrip } from "@/components/ui";
import { DownloadIcon, EyeOffIcon } from "@/components/icons";
import { CodeBlock, DocLayout, DocSection, Prose, ThresholdCallout, type TableOfContentsItem } from "@/components/doc";
import { BreadcrumbJsonLd, DatasetJsonLd } from "@/components/seo/json-ld";
import { datasetDownloads, getDatasetIndex } from "@/lib/api";
import { formatDateTime } from "@/lib/utils/format";

// Request-time rendering: content comes from the API, a separate deployment
// not guaranteed reachable at build time. See app/page.tsx for the full
// rationale (build must not depend on a live API; the fetch cache still applies).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open data",
  description:
    "The interface is replaceable; the data is not. Download the full Rishwat.fyi reports dataset as CSV or JSON, read what it contains and what it deliberately excludes, and learn how to cite it.",
  alternates: { canonical: "/data" },
};

const TOC: TableOfContentsItem[] = [
  { id: "dataset", label: "The dataset" },
  { id: "contents", label: "What's inside" },
  { id: "cite", label: "How to cite" },
  { id: "more", label: "Read further" },
];

export default async function DataPage() {
  const index = await getDatasetIndex();
  const { generated_at, license } = index.data;
  const downloads = datasetDownloads(index.data);
  const formats = downloads.map((entry) => entry.format.toUpperCase()).join(" · ");

  const citation = `Rishwat.fyi — citizen-reported government-service experiences (reports dataset). Snapshot generated ${formatDateTime(generated_at)}. Licensed under CC BY 4.0.`;

  return (
    <>
      <DatasetJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Open data", url: "/data" },
        ]}
      />
      <DocLayout
      title="Open data"
      lead="Rishwat.fyi is infrastructure, not just a website. Every public number links back to the dataset, the API, and the method behind it — because the data has to outlive the interface."
      toc={TOC}
      sourcePath="docs/api.md · GET /datasets"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Data" }]}
      intro={
        <>
          {index.source === "sample" ? (
            <SampleDataStrip reason={index.reason?.message} className="mt-6" />
          ) : null}
          {/* Editorial header illustration (brand asset). Decorative — the page's
              meaning is in the text below — so alt is empty; framed as a hairline
              figure and capped so it never dominates a phone screen. */}
          <div className="mt-6 overflow-hidden rounded-lg border border-line">
            <Image
              src="/brand/illustration-open-data.webp"
              alt=""
              width={1200}
              height={800}
              sizes="(min-width: 1024px) 640px, 100vw"
              priority
              className="h-auto w-full"
            />
          </div>
          <p className="prose-measure mt-6 font-serif text-figure-lg font-bold leading-tight text-ink">
            If transparency depends on one website staying online, it isn&rsquo;t really transparent.
          </p>
        </>
      }
    >
      <DocSection
        id="dataset"
        title="The dataset"
        lead="One row per published report. Served with no caching so a copy is always the current snapshot."
      >
        <div className="rounded-lg border border-line bg-surface">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-sans text-h3 font-semibold text-ink">reports</p>
              <p className="mt-1 max-w-prose text-body text-ink-secondary">
                The full public dataset of published, anonymised citizen reports.
              </p>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-label">
                <div>
                  <dt className="text-ink-muted">Formats</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formats}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Snapshot generated</dt>
                  <dd className="tabular mt-0.5 font-medium text-ink">{formatDateTime(generated_at)}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Size</dt>
                  <dd className="mt-0.5 font-medium text-ink">Varies per snapshot</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Licence</dt>
                  <dd className="mt-0.5 font-medium text-ink">CC BY 4.0 · provisional</dd>
                </div>
              </dl>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              {downloads.map((entry) => (
                <ButtonLink
                  key={`${entry.name}-${entry.format}`}
                  href={entry.url}
                  external
                  variant={entry.format === "csv" ? "primary" : "secondary"}
                  iconLeading={<DownloadIcon size={18} />}
                >
                  {entry.name}.{entry.format}
                </ButtonLink>
              ))}
            </div>
          </div>
          <div className="border-t border-line-inner px-5 py-3">
            <p className="text-label text-ink-muted">
              Licence, verbatim from the API: <span className="text-ink-secondary">{license}</span>
            </p>
          </div>
        </div>

        <NoticeStrip className="mt-5" />
        <ThresholdCallout className="mt-4" />
      </DocSection>

      <DocSection
        id="contents"
        title="What's inside — and what isn't"
        lead="The export is deliberately scoped. It carries the experience and its provenance, and structurally cannot carry anything that identifies a person."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="font-sans text-h3 font-semibold text-ink">In the dataset</p>
            <ul className="mt-3 space-y-2 text-body text-ink-secondary">
              <li>Public report ID, service, department, state and district</li>
              <li>The reporting period</li>
              <li>Reported official fee, additional amount, and amount paid</li>
              <li>Reported delay in days and number of office visits</li>
              <li>The redacted description and the verification status</li>
            </ul>
            <p className="mt-4 text-label text-ink-muted">
              Every column is defined in the <a href="/data/dictionary" className="font-medium text-official-mid underline underline-offset-2">data dictionary</a>.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="flex items-center gap-2 font-sans text-h3 font-semibold text-ink">
              <span aria-hidden="true" className="text-official-mid">
                <EyeOffIcon size={20} />
              </span>
              Deliberately excluded
            </p>
            <ul className="mt-3 space-y-2 text-body text-ink-secondary">
              <li>
                <code className="font-mono text-ink">ip_hash</code> — the SHA-256 of the reporter&rsquo;s IP
              </li>
              <li>Device fingerprint hashes</li>
              <li>Submission-token hashes</li>
              <li>Any office identifiers or locations</li>
            </ul>
            <p className="mt-4 text-label text-ink-muted">
              These are never selected into an export — not redacted, absent by construction. Only
              published reports appear; <code className="font-mono">submitted</code>,{" "}
              <code className="font-mono">rejected</code> and <code className="font-mono">withdrawn</code> never do.
            </p>
          </div>
        </div>
      </DocSection>

      <DocSection
        id="cite"
        title="How to cite"
        lead="The dataset is CC BY 4.0 — you may republish it as long as you credit the source."
      >
        <CodeBlock code={citation} label="Suggested citation" ariaLabel="Suggested citation for the dataset" />
        <Prose className="prose-measure mt-6">
          <p>
            Attribution is required under CC BY 4.0: name Rishwat.fyi as the source and link back to
            the dataset where you can. When you cite a specific figure, include the snapshot&rsquo;s{" "}
            <code>generated_at</code> so readers can locate the exact version you used. And carry the
            data-quality notice with the numbers: citizen reports represent reported experiences and
            are not automatically verified findings of wrongdoing.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="more" title="Read further" lead="The number on screen, the contract behind it, and how to keep it alive.">
        <Prose className="prose-measure">
          <ul>
            <li>
              <a href="/data/api">API reference</a> — every endpoint, its parameters, and example
              responses.
            </li>
            <li>
              <a href="/data/dictionary">Data dictionary</a> — every dataset column, its type and its
              privacy class.
            </li>
            <li>
              <a href="/methodology">Methodology</a> — how the aggregates are computed and the
              publishing threshold.
            </li>
            <li>
              <a href="/mirroring">Mirroring</a> — how to run an independent copy of the dataset.
            </li>
          </ul>
        </Prose>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <ActionLink href="/data/api">Read the API reference</ActionLink>
          <ActionLink href="/data/dictionary">Open the data dictionary</ActionLink>
          <ActionLink href="/mirroring">Mirror the dataset</ActionLink>
        </div>
      </DocSection>
      </DocLayout>
    </>
  );
}
