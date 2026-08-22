import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SampleDataStrip } from "@/components/ui";
import { getComparisonRows, listDepartments } from "@/lib/api";
import { parseInr } from "@/lib/utils/format";
import { DepartmentGroupList, type DepartmentSummary } from "@/components/geo";

// Request-time rendering: content comes from the API, a separate deployment
// not guaranteed reachable at build time. See app/page.tsx for the full
// rationale (build must not depend on a live API; the fetch cache still applies).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Government departments",
  description:
    "The government departments behind the services we track — Transport, Registration, Revenue, Municipal, Police and more — each with its service count, official-fee range and citizen report count.",
  alternates: { canonical: "/departments" },
};

export default async function DepartmentsPage() {
  const departmentsSourced = await listDepartments();
  const departments = departmentsSourced.data;

  // Associate services with their department by SLUG, the API's canonical
  // filter — never by matching the display name, which can drift in
  // punctuation ("&" vs "and") and would silently show zero services.
  const perDepartment = await Promise.all(
    departments.map(async (department) => ({
      department,
      rows: await getComparisonRows({ department: department.slug, per_page: 100 }),
    })),
  );

  let sample = departmentsSourced.source === "sample";
  let sampleReason = departmentsSourced.reason?.message;

  const summaries: DepartmentSummary[] = perDepartment.map(({ department, rows }) => {
    if (rows.source === "sample") {
      sample = true;
      sampleReason ??= rows.reason?.message;
    }
    const depRows = rows.data;
    const fees = depRows
      .map((row) => parseInr(row.official.fee_inr))
      .filter((fee): fee is number => fee !== null);
    const reportCount = depRows.reduce((sum, row) => sum + row.report_count, 0);
    return {
      slug: department.slug,
      name: department.name,
      category: department.category,
      serviceCount: depRows.length,
      reportCount,
      feeMin: fees.length > 0 ? Math.min(...fees) : null,
      feeMax: fees.length > 0 ? Math.max(...fees) : null,
    };
  });

  const totalServices = summaries.reduce((sum, department) => sum + department.serviceCount, 0);

  return (
    <Container>
      <div className="space-y-6 py-8 lg:py-10">
        <header className="prose-measure">
          <h1 className="font-serif text-h1 font-bold text-ink">Government departments</h1>
          <p className="mt-2 text-body-lg text-ink-secondary">
            The {summaries.length} departments behind the {totalServices} services in the launch
            catalogue. Each shows its official-fee range and how many citizens have reported an
            experience.
          </p>
        </header>

        {sample ? <SampleDataStrip reason={sampleReason} /> : null}

        <DepartmentGroupList departments={summaries} />
      </div>
    </Container>
  );
}
