import type { CityRef, DepartmentRef, DistrictRef, StateRef } from "@/lib/api";
import {
  ActionLink,
  Button,
  Callout,
  Field,
  NativeSelect,
  RadioGroup,
  type RadioOption,
} from "@/components/ui";
import { InfoIcon } from "@/components/icons";

/**
 * The search-results filter rail ("Refine your search"). It is a plain
 * `<form method="get" action="/search">` so it works without JavaScript: every
 * control is submitted together when "Apply filters" is pressed, and the server
 * re-renders with the new query. Location is expressed by NAME to match the
 * `/search` contract; dependent options (districts of the chosen state, cities
 * of the chosen district) are computed server-side and passed in.
 *
 * The API exposes no service-type or city filter, so those controls are honest
 * placeholders that mirror the reference board — they never fabricate a filter
 * the data layer cannot honour.
 */

export interface SearchFiltersProps {
  q: string;
  departments: DepartmentRef[];
  department: string;
  states: StateRef[];
  state: string;
  districts: DistrictRef[];
  district: string;
  cities: CityRef[];
  city: string;
  sort: string;
  /** Distinguishes the rail instance from the mobile sheet instance. */
  formId?: string;
}

const SORT_OPTIONS: RadioOption[] = [
  { value: "relevance", label: "Relevance" },
  { value: "reports", label: "Most reports" },
  { value: "amount", label: "Highest additional amount" },
  { value: "delay", label: "Longest delay" },
];

export function SearchFilters({
  q,
  departments,
  department,
  states,
  state,
  districts,
  district,
  cities,
  city,
  sort,
  formId = "search-filters",
}: SearchFiltersProps) {
  const hasState = state.length > 0;
  const hasDistrict = district.length > 0;

  return (
    <form method="get" action="/search" className="flex flex-col gap-6" aria-label="Refine search">
      {/* Preserve the current query term across a filter submit. */}
      <input type="hidden" name="q" value={q} />

      <div className="flex items-center justify-between">
        <h2 className="font-sans text-h3 font-semibold text-ink">Refine your search</h2>
        <ActionLink href="/search" aria-label="Clear all filters">
          Clear all
        </ActionLink>
      </div>

      <Field label="Department" htmlFor={`${formId}-department`}>
        <NativeSelect id={`${formId}-department`} name="department" defaultValue={department}>
          <option value="">All departments</option>
          {departments.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.name}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field
        label="Service type"
        htmlFor={`${formId}-service-type`}
        hint="Every service of the selected department is shown."
      >
        <NativeSelect id={`${formId}-service-type`} name="service_type" defaultValue="">
          <option value="">All types</option>
        </NativeSelect>
      </Field>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-label font-medium text-ink">Location</legend>

        <Field label="State" htmlFor={`${formId}-state`}>
          <NativeSelect id={`${formId}-state`} name="state" defaultValue={state}>
            <option value="">All states</option>
            {states.map((entry) => (
              <option key={entry.code} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="District" htmlFor={`${formId}-district`}>
          <NativeSelect
            id={`${formId}-district`}
            name="district"
            defaultValue={district}
            disabled={!hasState}
          >
            <option value="">{hasState ? "All districts" : "Choose a state first"}</option>
            {districts.map((entry) => (
              <option key={entry.code} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label="City / Office"
          htmlFor={`${formId}-city`}
          hint="Results are grouped by district."
        >
          <NativeSelect
            id={`${formId}-city`}
            name="city"
            defaultValue={city}
            disabled={!hasDistrict}
          >
            <option value="">{hasDistrict ? "All" : "Choose a district first"}</option>
            {cities.map((entry) => (
              <option key={entry.id} value={entry.name}>
                {entry.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </fieldset>

      <RadioGroup name="sort" legend="Sort by" options={SORT_OPTIONS} defaultValue={sort} />

      <Button type="submit" variant="primary" block>
        Apply filters
      </Button>

      <Callout tone="notice" title="What am I seeing?" icon={<InfoIcon size={20} />}>
        Official information comes from government sources. Citizen experience comes from verified
        community reports.
        <span className="mt-2 block">
          <ActionLink href="/methodology">Learn more about our methodology</ActionLink>
        </span>
      </Callout>
    </form>
  );
}
