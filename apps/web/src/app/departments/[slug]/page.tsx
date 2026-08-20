import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/container";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  NoticeStrip,
  SampleDataStrip,
  SectionHeading,
  type Crumb,
} from "@/components/ui";
import { ArrowRightIcon, CompassIcon, ExternalIcon, SearchIcon } from "@/components/icons";
import { getComparisonRows, getDepartment, getServiceDetail } from "@/lib/api";
import type { GovernmentSource } from "@/lib/api/types";
import { formatCount, formatDate, humanizeSlug } from "@/lib/utils/format";
import { ServiceComparisonTable } from "@/components/geo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) return { title: "Department not found" };
  const { name, category } = department.data;
  return {
    title: name,
    description: `${name} (${humanizeSlug(category)}): official fees, timelines and documents for its services, compared with what citizens reported experiencing.`.slice(
      0,
      300,
    ),
    alternates: { canonical: `/departments/${slug}` },
  };
}

export default async function DepartmentDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [departmentSourced, rowsSourced] = await Promise.all([
    getDepartment(slug),
    getComparisonRows({ department: slug, per_page: 100 }),
  ]);
  if (!departmentSourced) notFound();

  const department = departmentSourced.data;
  const rows = rowsSourced.data;

  // Aggregate the government sources cited by this department's services.
  const details = await Promise.all(rows.map((row) => getServiceDetail(row.slug)));
  const sourceByUrl = new Map<string, GovernmentSource>();
  let detailSample = false;
  for (const detail of details) {
    if (!detail) continue;
    if (detail.source === "sample") detailSample = true;
    for (const source of Object.values(detail.data.sources)) {
      if (source && !sourceByUrl.has(source.url)) sourceByUrl.set(source.url, source);
    }
  }
  const sources = [...sourceByUrl.values()];

  const reportCount = rows.reduce((sum, row) => sum + row.report_count, 0);
  const sample =
    departmentSourced.source === "sample" || rowsSourced.source === "sample" || detailSample;
  const sampleReason =
    rowsSourced.reason?.message ?? departmentSourced.reason?.message;

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Departments", href: "/departments" },
    { label: department.name },
  ];

  return (
    <Container>
      <PageHeader
        breadcrumbs={crumbs}
        title={department.name}
        titleAdornment={<Badge tone="sage">{humanizeSlug(department.category)}</Badge>}
        subtitle={`Official fees, timelines and documents for services delivered by the ${department.name}, next to what citizens reported experiencing.`}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <CompassIcon size={16} className="text-ink-muted" />
              {formatCount(rows.length)} {rows.length === 1 ? "service" : "services"}
            </span>
            <span>{formatCount(reportCount)} citizen reports</span>
          </>
        }
        actions={
          <ButtonLink
            href={`/search?department=${encodeURIComponent(slug)}`}
            variant="secondary"
            iconLeading={<SearchIcon size={18} />}
          >
            Search this department
          </ButtonLink>
        }
      />

      <div className="space-y-8 pb-10">
        {sample ? <SampleDataStrip reason={sampleReason} /> : null}

        <section aria-labelledby="department-services-heading">
          <SectionHeading
            id="department-services-heading"
            description="Official figures come from government sources; citizen figures are medians from published reports."
          >
            Services in this department
          </SectionHeading>
          {rows.length > 0 ? (
            <ServiceComparisonTable rows={rows} />
          ) : (
            <Card>
              <EmptyState
                icon={<CompassIcon />}
                title="No services listed yet"
                description="This department has no services in the launch catalogue yet."
              />
            </Card>
          )}
        </section>

        {sources.length > 0 ? (
          <section aria-labelledby="department-sources-heading">
            <SectionHeading
              id="department-sources-heading"
              description="The official government portals the fees and timelines above are drawn from."
            >
              Government sources
            </SectionHeading>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sources.map((source) => (
                <li key={source.url}>
                  <Card padded className="h-full">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group inline-flex items-start gap-2 font-medium text-ink transition-colors duration-150 hover:text-official-mid"
                    >
                      <ExternalIcon
                        size={18}
                        className="mt-0.5 shrink-0 text-ink-muted transition-colors duration-150 group-hover:text-official-mid"
                      />
                      <span className="min-w-0">{source.title}</span>
                    </a>
                    <p className="mt-1 pl-7 text-label text-ink-muted">
                      Last verified: {formatDate(source.last_verified_at)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="department-search-heading">
          <SectionHeading id="department-search-heading">Go deeper</SectionHeading>
          <Card padded>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[52ch] text-body text-ink-secondary">
                Compare these services by state and district, or filter the full catalogue to this
                department.
              </p>
              <ButtonLink
                href={`/search?department=${encodeURIComponent(slug)}`}
                variant="primary"
                iconTrailing={<ArrowRightIcon size={18} />}
              >
                Search {department.name}
              </ButtonLink>
            </div>
          </Card>
        </section>

        <NoticeStrip />
      </div>
    </Container>
  );
}
