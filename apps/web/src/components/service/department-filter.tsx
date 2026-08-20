import type { DepartmentRef } from "@/lib/api";
import { Button, NativeSelect } from "@/components/ui";

/**
 * Department filter for the /services index. A plain `<form method="get">` so
 * it filters via `?department=` without JavaScript; the server re-renders the
 * grouped list. Selecting "All departments" clears the filter.
 */
export function DepartmentFilter({
  departments,
  department,
}: {
  departments: DepartmentRef[];
  department: string;
}) {
  return (
    <form method="get" action="/services" className="flex items-end gap-2" aria-label="Filter by department">
      <label className="flex flex-col gap-1.5">
        <span className="text-label font-medium text-ink">Department</span>
        <NativeSelect name="department" defaultValue={department} className="min-w-56">
          <option value="">All departments</option>
          {departments.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.name}
            </option>
          ))}
        </NativeSelect>
      </label>
      <Button type="submit" variant="secondary">
        Filter
      </Button>
    </form>
  );
}
