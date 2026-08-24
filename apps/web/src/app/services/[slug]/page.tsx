import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/container";
import { SampleDataStrip, Tabs, type Crumb, type TabItem } from "@/components/ui";
import { ShieldCheckIcon, UsersIcon } from "@/components/icons";
import { getDatasetGeneratedAt, getServiceDetail, listDepartments } from "@/lib/api";
import { formatCount, formatDate, formatDays, formatInr } from "@/lib/utils/format";
import {
  BreadcrumbJsonLd,
  FaqJsonLd,
  GovernmentServiceJsonLd,
} from "@/components/seo/json-ld";

import { AboutProcessTab } from "@/components/service/about-process-tab";
import { DocumentsTab } from "@/components/service/documents-tab";
import { OverviewTab } from "@/components/service/overview-tab";
import { ReportsTab } from "@/components/service/reports-tab";
import {
  deriveVerification,
  getServiceInsights,
  getServiceReports,
  isCorroborated,
} from "@/components/service/service-data";
import { ServiceActions } from "@/components/service/service-actions";
import { TrendsTab } from "@/components/service/trends-tab";

const TABS: TabItem[] = [
  { value: "overview", label: "Overview" },
  { value: "reports", label: "Reports" },
  { value: "trends", label: "Trends" },
  { value: "documents", label: "Documents" },
  { value: "about", label: "About the process" },
];
const TAB_VALUES = new Set(TABS.map((tab) => tab.value));

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getServiceDetail(slug);
  if (!detail) return { title: "Service not found" };
  const { service } = detail.data;
  const search = await searchParams;
  const stateName = first(search.state);
  const districtName = first(search.district);
  const locationSuffix = [districtName, stateName].filter(Boolean).join(", ");
  const title = locationSuffix ? `${service.name} in ${locationSuffix}` : service.name;
  const baseDesc = `${service.name}: official fee ${formatInr(service.official_fee_inr)} and ${formatDays(
    service.official_timeline_days,
  )} official timeline, compared with what citizens reported. ${service.description}`;
  const description = locationSuffix
    ? `${service.name} in ${locationSuffix}: ${baseDesc}`
    : baseDesc;

  const searchParamsForCanonical = new URLSearchParams();
  if (stateName) searchParamsForCanonical.set("state", stateName);
  if (districtName) searchParamsForCanonical.set("district", districtName);
  const qs = searchParamsForCanonical.toString();
  const canonical = qs ? `/services/${service.slug}?${qs}` : `/services/${service.slug}`;

  // Filter combos beyond one location use noindex (protect crawl budget)
  const shouldNoIndex = Boolean(search.tab && search.tab !== "overview");

  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical },
    ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description: description.slice(0, 200),
      url: canonical,
      type: "article",
    },
  };
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const detail = await getServiceDetail(slug);
  if (!detail) notFound();

  const search = await searchParams;
  const tabParam = first(search.tab);
  const tab = TAB_VALUES.has(tabParam) ? tabParam : "overview";
  const stateName = first(search.state);
  const districtName = first(search.district);

  const { service, sources, citizen, notice } = detail.data;
  const verification = deriveVerification(citizen);
  const insights = getServiceInsights(slug);

  const [departments, lastUpdated] = await Promise.all([
    listDepartments(),
    getDatasetGeneratedAt(),
  ]);
  const departmentSlug = departments.data.find((entry) => entry.name === service.department)?.slug;

  const locationLabel = [districtName, stateName].filter(Boolean).join(", ");
  const lastVerified = sources.fee?.last_verified_at ?? sources.timeline?.last_verified_at ?? null;

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    {
      label: service.department,
      href: departmentSlug ? `/services?department=${departmentSlug}` : "/services",
    },
    { label: service.name, href: `/services/${service.slug}` },
  ];
  if (locationLabel) crumbs.push({ label: locationLabel });

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: service.department, url: departmentSlug ? `/services?department=${departmentSlug}` : "/services" },
    { name: service.name, url: `/services/${service.slug}` },
    ...(locationLabel ? [{ name: locationLabel, url: `/services/${service.slug}?state=${encodeURIComponent(stateName)}${districtName ? `&district=${encodeURIComponent(districtName)}` : ""}` }] : []),
  ];

  const reportsSourced = tab === "reports" ? getServiceReports(slug) : null;
  const showSample =
    detail.source === "sample" || tab === "trends" || (reportsSourced?.source === "sample");
  const sampleReason =
    detail.source === "sample"
      ? detail.reason?.message
      : tab === "trends"
        ? insights.reason?.message
        : reportsSourced?.reason?.message;

  // FAQ for service — eligible for rich results
  const faqItems = [
    {
      question: `What is the official fee for ${service.name}?`,
      answer: `The official fee is ${formatInr(service.official_fee_inr)} as per the government source last verified ${formatDate(lastVerified)}.`,
    },
    {
      question: `How long should ${service.name} take officially?`,
      answer: `Official timeline is ${formatDays(service.official_timeline_days)}. Citizen reports may show longer due to procedural friction.`,
    },
    {
      question: `What documents are required for ${service.name}?`,
      answer: `${service.official_documents.map((d) => d.name).join(", ") || "See the official source for document list"}.`,
    },
    {
      question: "Are citizen reports verified?",
      answer: "Reports climb a verification ladder: submitted → validated → corroborated → evidence-backed → officially acknowledged. Only published aggregates contribute to the statistics.",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <GovernmentServiceJsonLd
        slug={service.slug}
        name={service.name}
        department={service.department}
        description={service.description}
        officialFeeInr={service.official_fee_inr}
        officialTimelineDays={service.official_timeline_days}
        reportCount={citizen.report_count}
        areaServed={locationLabel || "India"}
      />
      <FaqJsonLd items={faqItems} />
      <Container>
      <PageHeader
        breadcrumbs={crumbs}
        title={service.name}
        titleAdornment={
          isCorroborated(citizen) ? (
            <ShieldCheckIcon
              size={24}
              className="text-official-mid"
              title="Corroborated by multiple independent reports"
            />
          ) : null
        }
        subtitle={[service.department, locationLabel].filter(Boolean).join(", ")}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <UsersIcon size={16} className="text-ink-muted" />
              {formatCount(citizen.report_count)} citizen reports
            </span>
            <span>Last official source verification: {formatDate(lastVerified)}</span>
          </>
        }
        actions={<ServiceActions slug={service.slug} title={service.name} />}
      />

      <Tabs items={TABS} defaultValue="overview" ariaLabel="Service sections" />

      <div className="py-8">
        <h2 className="sr-only">{TABS.find((item) => item.value === tab)?.label ?? "Overview"}</h2>
        {showSample ? <SampleDataStrip reason={sampleReason} className="mb-6" /> : null}

        {tab === "overview" ? (
          <OverviewTab
            service={service}
            citizen={citizen}
            verification={verification}
            notice={notice}
            lastUpdated={lastUpdated}
            insights={insights.data}
          />
        ) : null}

        {tab === "reports" && reportsSourced ? (
          <ReportsTab reports={reportsSourced.data} reportHref="/reports" />
        ) : null}

        {tab === "trends" ? (
          <TrendsTab
            distributions={insights.data.distributions}
            timelineMedian={
              citizen.delay_median !== null && service.official_timeline_days !== null
                ? formatDays(service.official_timeline_days + citizen.delay_median)
                : "—"
            }
            amountMedian={
              citizen.extra_payment_median !== null ? formatInr(citizen.extra_payment_median) : "—"
            }
          />
        ) : null}

        {tab === "documents" ? <DocumentsTab documents={service.official_documents} /> : null}

        {tab === "about" ? (
          <AboutProcessTab steps={service.process_steps} sources={sources} />
        ) : null}
      </div>
      </Container>
    </>
  );
}
