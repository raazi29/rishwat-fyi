import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { CodeIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils/format";

import { DocToc } from "./doc-toc";
import type { TableOfContentsItem } from "./types";

/**
 * The Read-surface scaffold: a centred reading column with a serif h1 and lead,
 * the article body, and a source-provenance footer; plus an optional sticky
 * in-page table of contents rail on ≥1024px (DESIGN.md: Read mode). The article
 * is not force-measured — running text opts into `prose-measure` while tables
 * and cards use the full column width.
 */
export function DocLayout({
  title,
  lead,
  toc,
  tocTitle,
  breadcrumbs,
  sourcePath,
  sourceHref,
  updated,
  intro,
  children,
  footer,
}: {
  title: ReactNode;
  lead?: ReactNode;
  toc?: TableOfContentsItem[];
  tocTitle?: string;
  breadcrumbs?: Crumb[];
  /** Repo-relative path the page renders, e.g. `docs/methodology.md`. */
  sourcePath: string;
  sourceHref?: string;
  /** ISO date; rendered as "Last updated …" when supplied. */
  updated?: string;
  /** Optional content between the header and the first section (e.g. a lead-in). */
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const hasToc = toc !== undefined && toc.length > 0;

  return (
    <Container>
      <div className="py-8 lg:py-10">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
        ) : null}

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <article className="min-w-0 flex-1">
            <header>
              <h1 className="font-serif text-h1 font-bold text-ink">{title}</h1>
              {lead ? (
                <p className="prose-measure mt-4 text-body-lg text-ink-secondary">{lead}</p>
              ) : null}
            </header>

            {intro}
            {children}

            <DocSourceNote path={sourcePath} href={sourceHref} updated={updated} />
            {footer}
          </article>

          {hasToc ? (
            <aside className="hidden shrink-0 lg:block lg:w-56">
              <div className="sticky top-24">
                <DocToc items={toc} title={tocTitle} />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

/**
 * Provenance for the page. The interface is replaceable; every Read page names
 * the repository document it renders. When a canonical source URL is known it
 * links out; otherwise the repo path is shown in mono, and we do not fabricate
 * a location.
 */
function DocSourceNote({
  path,
  href,
  updated,
}: {
  path: string;
  href?: string;
  updated?: string;
}) {
  return (
    <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-label text-ink-muted sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2">
        <span aria-hidden="true" className="text-ink-muted">
          <CodeIcon size={16} />
        </span>
        <span>
          This page renders{" "}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-mono font-medium text-official-mid underline underline-offset-2"
            >
              {path}
            </a>
          ) : (
            <code className="font-mono text-ink-secondary">{path}</code>
          )}{" "}
          from the open project repository.
        </span>
      </p>
      {updated ? <p className="tabular">Last updated {formatDate(updated)}</p> : null}
    </div>
  );
}
