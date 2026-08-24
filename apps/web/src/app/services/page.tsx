import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ButtonLink, EmptyState, SampleDataStrip } from "@/components/ui";
import { CompassIcon } from "@/components/icons";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getComparisonRows, listDepartments, type ComparisonRow } from "@/lib/api";
import { DepartmentFilter } from "@/components/service/department-filter";
import { ServiceGroup } from "@/components/service/service-group";

// Request-time rendering: content comes from the API, a separate deployment
// not guaranteed reachable at build time. See app/page.tsx for the full
// rationale (build must not depend on a live API; the fetch cache still applies).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Government services",
  description:
    "Browse the launch catalogue of Indian government services grouped by department, each with its official fee and timeline and the number of citizen reports.",
  alternates: { canonical: "/services" },
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim();
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const department = first((await searchParams).department);

  const [rowsSourced, departmentsSourced] = await Promise.all([
    getComparisonRows({ department: department || undefined, per_page: 100 }),
    listDepartments(),
  ]);

  const rows = rowsSourced.data;
  const departments = departmentsSourced.data;
  const sample = rowsSourced.source === "sample" || departmentsSourced.source === "sample";
  const sampleReason = rowsSourced.reason?.message ?? departmentsSourced.reason?.message;

  // Group by department name, following the seed order of the departments list,
  // then append any groups whose department name is not in that list.
  const groups: Array<{ department: string; rows: ComparisonRow[] }> = [];
  const grouped = new Set<string>();
  for (const dep of departments) {
    const depRows = rows.filter((row) => row.department === dep.name);
    if (depRows.length > 0) {
      groups.push({ department: dep.name, rows: depRows });
      grouped.add(dep.name);
    }
  }
  for (const row of rows) {
    if (grouped.has(row.department)) continue;
    grouped.add(row.department);
    groups.push({ department: row.department, rows: rows.filter((r) => r.department === row.department) });
  }

  const total = rows.length;
  const activeDepartment = department
    ? departments.find((entry) => entry.slug === department)?.name
    : undefined;

  const countLabel = activeDepartment
    ? `${total} ${total === 1 ? "service" : "services"} in ${activeDepartment}`
    : `${total} ${total === 1 ? "service" : "services"} across ${groups.length} ${
        groups.length === 1 ? "department" : "departments"
      }`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Government services", url: "/services" },
        ]}
      />
      <Container>
      <div className="space-y-6 py-8 lg:py-10">
        <header className="prose-measure">
          <h1 className="font-serif text-h1 font-bold text-ink">Government services</h1>
          <p className="mt-2 text-body-lg text-ink-secondary">
            The official fee and timeline of each service in the launch catalogue, next to how many
            citizens have reported their experience.
          </p>
        </header>

        {sample ? <SampleDataStrip reason={sampleReason} /> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <DepartmentFilter departments={departments} department={department} />
          <p className="text-label text-ink-secondary tabular">{countLabel}</p>
        </div>

        {total === 0 ? (
          <EmptyState
            icon={<CompassIcon />}
            title="No services in this department"
            description="That filter returned nothing. Clear it to see the full catalogue."
            action={
              <ButtonLink href="/services" variant="primary">
                Show all services
              </ButtonLink>
            }
            className="rounded-lg border border-line bg-surface"
          />
        ) : (
          <div>
            {groups.map((group, index) => (
              <ServiceGroup
                key={group.department}
                department={group.department}
                rows={group.rows}
                headingId={`dept-${index}`}
              />
            ))}
          </div>
        )}
      </div>
      </Container>
    </>
  );
}
