import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/container";
import { NoticeStrip, SampleDataStrip, SectionHeading } from "@/components/ui";
import { BreadcrumbJsonLd, CollectionPageJsonLd, FaqJsonLd } from "@/components/seo/json-ld";
import { getComparisonRows, getStateDetail, listDistricts } from "@/lib/api";
import { ServiceComparisonTable } from "@/components/geo";
import { formatCount } from "@/lib/utils/format";

type Params = Promise<{ code: string; district: string }>;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function deslugify(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code, district: districtSlug } = await params;
  const districtsSourced = await listDistricts(code);
  const districtName =
    districtsSourced.data.find((d) => slugify(d.name) === districtSlug.toLowerCase())?.name ??
    deslugify(districtSlug);
  const stateDetail = await getStateDetail(code);
  const stateName = stateDetail?.data.state.name ?? code;

  const title = `Government services in ${districtName}, ${stateName}`;
  const description = `Official fees, timelines and documents for government services in ${districtName}, ${stateName}, compared with what citizens reported experiencing there.`.slice(
    0,
    300,
  );

  return {
    title,
    description,
    alternates: { canonical: `/states/${code}/${districtSlug}` },
    openGraph: { title, description: description.slice(0, 200), url: `/states/${code}/${districtSlug}` },
  };
}

export default async function DistrictPage({ params }: { params: Params }) {
  const { code, district: districtSlug } = await params;

  const [stateDetail, districtsSourced] = await Promise.all([getStateDetail(code), listDistricts(code)]);

  if (!stateDetail) notFound();
  const districtEntry = districtsSourced.data.find((d) => slugify(d.name) === districtSlug.toLowerCase());
  if (!districtEntry) notFound();

  const districtName = districtEntry.name;
  const stateName = stateDetail.data.state.name;

  const rowsSourced = await getComparisonRows({
    state: stateName,
    district: districtName,
    per_page: 100,
  });
  const rows = rowsSourced.data;
  const sample = rowsSourced.source === "sample";
  const reportCount = rows.reduce((sum, r) => sum + r.report_count, 0);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "States", url: "/states" },
    { name: stateName, url: `/states/${code}` },
    { name: districtName, url: `/states/${code}/${districtSlug}` },
  ];

  const faqItems = [
    {
      question: `What government services are tracked in ${districtName}?`,
      answer: `${rows.length} services are in the launch catalogue for ${districtName}, ${stateName}. Each shows its official fee and timeline versus citizen reports.`,
    },
    {
      question: `How many citizen reports in ${districtName}?`,
      answer: `${formatCount(reportCount)} citizen reports in ${districtName}. Statistics publish only when a (service, district) cell has ≥3 reports from ≥2 distinct IP buckets.`,
    },
    {
      question: "Are district statistics verified?",
      answer: "Reports climb the verification ladder and only published cells contribute. Citizen reports represent reported experiences, not legal findings.",
    },
  ];

  const collectionItems = rows.slice(0, 15).map((r) => ({ name: r.name, url: `/services/${r.slug}?state=${encodeURIComponent(stateName)}&district=${encodeURIComponent(districtName)}` }));

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {collectionItems.length > 0 ? (
        <CollectionPageJsonLd
          name={`Government services in ${districtName}, ${stateName}`}
          description={`Official government fees and citizen-reported experiences in ${districtName}, ${stateName}.`}
          url={`/states/${code}/${districtSlug}`}
          items={collectionItems}
        />
      ) : null}
      <FaqJsonLd items={faqItems} />
      <Container>
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "States", href: "/states" },
            { label: stateName, href: `/states/${code}` },
            { label: districtName },
          ]}
          title={districtName}
          subtitle={`${stateName} · ${formatCount(rows.length)} services · ${formatCount(reportCount)} citizen reports`}
          meta={
            <>
              <span>
                {formatCount(rows.length)} services tracked in this district
              </span>
              <span>{formatCount(reportCount)} citizen reports</span>
            </>
          }
        />

        <div className="space-y-8 pb-10">
          {sample ? <SampleDataStrip reason={rowsSourced.reason?.message} className="mt-2" /> : null}

          <section aria-labelledby="district-services-heading">
            <SectionHeading
              id="district-services-heading"
              description="Official figures from government sources; citizen figures are medians from published reports. Filter by state on each service page to see the district breakdown."
            >
              Services in {districtName}
            </SectionHeading>
            {rows.length > 0 ? (
              <ServiceComparisonTable rows={rows} />
            ) : (
              <div className="rounded-lg border border-line bg-surface p-8 text-center">
                <p className="text-body text-ink-secondary">
                  No services in the launch catalogue for this district yet. Browse the full catalogue or search by service name.
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="district-help-heading">
            <SectionHeading id="district-help-heading">Go deeper</SectionHeading>
            <div className="rounded-lg border border-line bg-surface p-5">
              <p className="max-w-[62ch] text-body text-ink-secondary">
                Compare official vs reported fees for a specific service in {districtName}, or see all districts in {stateName}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={`/states/${code}`} className="inline-flex min-h-11 items-center rounded-md bg-sage px-4 text-label font-medium text-official-mid">
                  View all districts in {stateName}
                </a>
                <a href="/services" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-label font-medium text-ink hover:bg-sunken">
                  Browse all services
                </a>
              </div>
            </div>
          </section>

          <NoticeStrip />
        </div>
      </Container>
    </>
  );
}
