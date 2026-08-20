import type { GovernmentSource, ProcessStep, ServiceSources } from "@/lib/api";
import { Card, EmptyState } from "@/components/ui";
import { ExternalIcon, InfoIcon } from "@/components/icons";
import { formatDate, formatIssue } from "@/lib/utils/format";

/**
 * The About-the-process tab: the official numbered procedure and the cited
 * government sources. Every official figure is backed here — each source shows
 * its title, a link to the government portal, and its `last_verified` date, so
 * a reader can check the number against its origin (Product Principle 2 & 5).
 */

interface ResolvedSource {
  source: GovernmentSource;
  backs: string[];
}

/** Group the sources by URL so a shared fee/timeline source lists both figures. */
function resolveSources(sources: ServiceSources): ResolvedSource[] {
  const byUrl = new Map<string, ResolvedSource>();
  for (const [key, source] of Object.entries(sources)) {
    if (!source) continue;
    const existing = byUrl.get(source.url);
    if (existing) existing.backs.push(key);
    else byUrl.set(source.url, { source, backs: [key] });
  }
  return [...byUrl.values()];
}

export function AboutProcessTab({
  steps,
  sources,
}: {
  steps: ProcessStep[];
  sources: ServiceSources;
}) {
  const resolvedSources = resolveSources(sources);
  const orderedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      <section aria-labelledby="process-heading">
        <h3 id="process-heading" className="mb-3 text-h3 font-semibold text-ink">
          The official process
        </h3>
        {orderedSteps.length === 0 ? (
          <EmptyState
            icon={<InfoIcon />}
            title="No process steps published"
            description="The official procedure for this service is not available yet."
            className="rounded-lg border border-line bg-surface"
          />
        ) : (
          <ol className="space-y-4">
            {orderedSteps.map((step) => (
              <li key={step.order} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-sage text-label font-semibold text-official-mid tabular"
                >
                  {step.order}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-sans text-h3 font-semibold text-ink">{step.title}</p>
                  <p className="mt-0.5 max-w-[68ch] text-body text-ink-secondary">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="sources-heading">
        <h3 id="sources-heading" className="mb-3 text-h3 font-semibold text-ink">
          Government sources
        </h3>
        {resolvedSources.length === 0 ? (
          <p className="text-body text-ink-secondary">
            No government source has been recorded for this service yet.
          </p>
        ) : (
          <div className="space-y-4">
            {resolvedSources.map(({ source, backs }) => (
              <Card key={source.url} padded className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-label font-medium text-ink-muted">Backs:</span>
                  {backs.map((key) => (
                    <span key={key} className="text-label text-ink-secondary">
                      {formatIssue(key)}
                    </span>
                  ))}
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-medium text-official-mid underline decoration-transparent decoration-1 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-official-mid"
                >
                  {source.title}
                  <ExternalIcon size={16} />
                </a>
                <p className="text-label text-ink-muted">
                  Last verified: {formatDate(source.last_verified_at)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
