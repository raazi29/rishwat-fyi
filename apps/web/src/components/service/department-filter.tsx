import type { DepartmentRef } from "@/lib/api";
import { Button, type SelectOption } from "@/components/ui";
import { FormSelect } from "@/components/ui/form-select";

/**
 * Department filter for the /services index. A plain `<form method="get">` so
 * it filters via `?department=`; the searchable Combobox keeps a synchronized
 * hidden input, so submission still carries the exact `department` slug (or an
 * empty value to clear). The server re-renders the grouped list, and selecting
 * "All departments" clears the filter.
 */
export function DepartmentFilter({
  departments,
  department,
}: {
  departments: DepartmentRef[];
  department: string;
}) {
  const departmentOptions: SelectOption[] = [
    { value: "", label: "All departments" },
    ...departments.map((entry) => ({ value: entry.slug, label: entry.name })),
  ];

  return (
    <form
      method="get"
      action="/services"
      className="flex items-end gap-2"
      aria-label="Filter by department"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="services-department" className="text-label font-medium text-ink">
          Department
        </label>
        <FormSelect
          variant="combobox"
          id="services-department"
          name="department"
          options={departmentOptions}
          defaultValue={department}
          placeholder="All departments"
          searchPlaceholder="Search departments…"
          aria-label="Department"
          className="min-w-56"
        />
      </div>
      <Button type="submit" variant="secondary">
        Filter
      </Button>
    </form>
  );
}
