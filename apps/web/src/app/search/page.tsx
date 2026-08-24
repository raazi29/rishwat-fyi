import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/layout/container";
import {
  ButtonLink,
  DataFreshness,
  EmptyState,
  NoticeStrip,
  Pagination,
  ResultCount,
  SampleDataStrip,
} from "@/components/ui";
import {
  getComparisonRows,
  getDatasetGeneratedAt,
  listDepartments,
  searchServices,
  type ServiceSearchParams,
} from "@/lib/api";

import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";

import { ComparisonTable } from "@/components/search/comparison-table";
import { ExportResults } from "@/components/search/export-results";
import { FiltersSheet } from "@/components/search/filters-sheet";
import { resolveLocation } from "@/components/search/resolve-location";
import {
  locationText,
  readSearch,
  sortRows,
  type RawSearchParams,
} from "@/components/search/search-params";
import { SearchFilters, type SearchFiltersProps } from "@/components/search/search-filters";
import { SearchTopBar } from "@/components/search/search-top-bar";

// Request-time rendering: content comes from the API, a separate deployment
// not guaranteed reachable at build time. See app/page.tsx for the full
// rationale (build must not depend on a live API; the fetch cache still applies).
export const dynamic = "force-dynamic";

/**
 * Dynamic metadata: `q` prefixes the title for query-specific ranking,
 * canonical self-references the sanitised param set so faceted pages
 * consolidate correctly, and paginated pages get noindex to protect
 * crawl budget (page 2+ is follow, not index).
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const read = readSearch(params);
  const parts: string[] = [];
  if (read.q) parts.push(`"${read.q}"`);
  if (read.department) parts.push(read.department);
  const loc = locationText(read.state, read.district) || read.city;
  if (loc) parts.push(loc);

  const hasQuery = Boolean(read.q || read.department || read.state || read.district || read.city);
  const title = read.q
    ? `${read.q} — Search services`
    : hasQuery
      ? `${parts.join(" · ")} — Search services`
      : "Search services";
  const description = hasQuery
    ? `Search results for ${parts.join(", ") || "government services"}: official fees, timelines and citizen-reported experiences compared side by side in India.`
    : "Search official government fees, timelines and documents in India and compare them, side by side, with what citizens actually reported experiencing.";

  // Sanitised self-canonical: whitelist + sort to avoid duplicate ?q=&q combos
  const search = new URLSearchParams();
  if (read.q) search.set("q", read.q);
  if (read.department) search.set("department", read.department);
  if (read.state) search.set("state", read.state);
  if (read.district) search.set("district", read.district);
  if (read.city) search.set("city", read.city);
  if (read.sort !== "relevance") search.set("sort", read.sort);
  if (read.page > 1) search.set("page", String(read.page));
  const qs = search.toString();
  const canonical = qs ? `/search?${qs}` : "/search";

  // Paginated or heavily faceted pages should not index but still pass equity
  const facetCount = [read.department, read.state, read.district, read.city].filter(Boolean).length;
  const shouldNoIndex = read.page > 1 || facetCount > 2;

  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical },
    ...(shouldNoIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description: description.slice(0, 200),
      url: canonical,
    },
  };
}

const PER_PAGE = 20;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const read = readSearch(await searchParams);
  const [resolved, departmentsSourced] = await Promise.all([
    resolveLocation(read),
    listDepartments(),
  ]);

  const apiParams: ServiceSearchParams = {
    q: read.q || undefined,
    department: read.department || undefined,
    state: resolved.state || undefined,
    district: resolved.district || undefined,
    page: read.page,
    per_page: PER_PAGE,
  };

  const [searchResult, rowsSourced, lastUpdated] = await Promise.all([
    searchServices(apiParams),
    getComparisonRows(apiParams),
    getDatasetGeneratedAt(),
  ]);

  const total = searchResult.data.total;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const rows = sortRows(rowsSourced.data, read.sort);
  const sample = searchResult.source === "sample" || rowsSourced.source === "sample";
  const sampleReason = rowsSourced.reason?.message ?? searchResult.reason?.message;

  const location = locationText(resolved.state, resolved.district);
  const activeFilterCount = [read.q, read.department, resolved.state, resolved.district, resolved.city].filter(
    Boolean,
  ).length;

  const filtersProps: Omit<SearchFiltersProps, "formId"> = {
    q: read.q,
    departments: departmentsSourced.data,
    department: read.department,
    states: resolved.states,
    state: resolved.state,
    districts: resolved.districts,
    district: resolved.district,
    cities: resolved.cities,
    city: resolved.city,
    sort: read.sort,
  };

  const descParts = [`${total} ${total === 1 ? "service" : "services"} found`];
  if (read.q) descParts.push(`for \u201C${read.q}\u201D`);
  if (location) descParts.push(`in ${location}`);

  const paginationParams: Record<string, string> = {};
  if (read.q) paginationParams.q = read.q;
  if (read.department) paginationParams.department = read.department;
  if (resolved.state) paginationParams.state = resolved.state;
  if (resolved.district) paginationParams.district = resolved.district;
  if (resolved.city) paginationParams.city = resolved.city;
  if (read.sort !== "relevance") paginationParams.sort = read.sort;

  const empty = total === 0 || rows.length === 0;

  const breadcrumbItems = [{ name: "Home", url: "/" }, { name: "Search", url: "/search" }];
  const itemList = !empty && read.page === 1
    ? rows.slice(0, 10).map((r) => ({ name: r.name, url: `/services/${r.slug}` }))
    : [];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {itemList.length > 0 ? <ItemListJsonLd name="Search results" items={itemList} /> : null}
      <Container>
      <div className="space-y-6 py-6 lg:py-8">
        <SearchTopBar query={read.q} location={location} />

        {/* Results come first in the DOM so the h1 precedes the filter rail's
            heading; the rail is placed back into column 1 on desktop. */}
        <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
          <div className="min-w-0 space-y-5 lg:col-start-2 lg:row-start-1">
            {sample ? <SampleDataStrip reason={sampleReason} /> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="font-serif text-h1 font-bold text-ink">Search results</h1>
                <p className="mt-1 text-body text-ink-secondary">{descParts.join(" ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <FiltersSheet activeCount={activeFilterCount} className="lg:hidden">
                  <SearchFilters {...filtersProps} formId="sheet" />
                </FiltersSheet>
                {!empty ? <ExportResults /> : null}
              </div>
            </div>

            {empty ? (
              <EmptyState
                media={
                  // Brand illustration for the no-results hero. Decorative — the
                  // heading and action carry the meaning — so alt is empty, and
                  // it is capped so it never dominates a phone screen.
                  <Image
                    src="/brand/illustration-no-results.webp"
                    alt=""
                    width={960}
                    height={640}
                    sizes="320px"
                    className="h-auto w-full max-w-[320px] rounded-md"
                  />
                }
                title="No services matched your search"
                description="Try a broader location, remove a filter, or browse the full service catalogue."
                action={
                  <ButtonLink href="/services" variant="primary">
                    Browse all services
                  </ButtonLink>
                }
                className="rounded-lg border border-line bg-surface"
              />
            ) : (
              <>
                <ComparisonTable rows={rows} />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <ResultCount page={read.page} perPage={PER_PAGE} total={total} unit="service" />
                  <Pagination
                    page={read.page}
                    totalPages={totalPages}
                    pathname="/search"
                    searchParams={paginationParams}
                  />
                </div>
                <div className="space-y-2">
                  <NoticeStrip notice="Numbers are medians unless stated otherwise. Official information may change. Always verify on the official portal." />
                  <DataFreshness updatedAt={lastUpdated} />
                </div>
              </>
            )}
          </div>

          <aside className="hidden lg:col-start-1 lg:row-start-1 lg:block">
            <div className="sticky top-20">
              <SearchFilters {...filtersProps} formId="rail" />
            </div>
          </aside>
        </div>
      </div>
      </Container>
    </>
  );
}
