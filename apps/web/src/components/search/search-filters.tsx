import type { CityRef, DepartmentRef, DistrictRef, StateRef } from "@/lib/api";
import {
  ActionLink,
  Button,
  Callout,
  Field,
  RadioGroup,
  type RadioOption,
  type SelectOption,
} from "@/components/ui";
import { FormSelect } from "@/components/ui/form-select";
import { InfoIcon } from "@/components/icons";

/**
 * The search-results filter rail ("Refine your search"), a
 * `<form method="get" action="/search">`: pressing "Apply filters" submits
 * every control together and the server re-renders with the new query.
 *
 * Department, service type, state, district and city are the custom
 * CustomSelect / Combobox controls (via {@link FormSelect}). Each keeps a
 * synchronized hidden `<input>`, so the GET contract is unchanged: the exact
 * parameter names are preserved and location is still expressed by NAME to
 * match the `/search` contract, while the sort radios and query term submit
 * natively. Dependent options (districts of the chosen state, cities of the
 * chosen district) are computed server-side and passed in; changing a parent
 * select takes effect on the next Apply, exactly as with the native selects it
 * replaces. The API exposes no service-type filter, so that control stays an
 * honest single-option placeholder that mirrors the reference board.
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

  // The leading empty option preserves the native "All …" choice: value "" is
  // submitted as an empty parameter (i.e. no filter), exactly as before, and
  // stays selectable so the user can clear one filter without "Clear all".
  const departmentOptions: SelectOption[] = [
    { value: "", label: "All departments" },
    ...departments.map((entry) => ({ value: entry.slug, label: entry.name })),
  ];
  const serviceTypeOptions: SelectOption[] = [{ value: "", label: "All types" }];
  const stateOptions: SelectOption[] = [
    { value: "", label: "All states" },
    ...states.map((entry) => ({ value: entry.name, label: entry.name })),
  ];
  const districtOptions: SelectOption[] = [
    { value: "", label: "All districts" },
    ...districts.map((entry) => ({ value: entry.name, label: entry.name })),
  ];
  const cityOptions: SelectOption[] = [
    { value: "", label: "All" },
    ...cities.map((entry) => ({ value: entry.name, label: entry.name })),
  ];

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
        <FormSelect
          variant="combobox"
          id={`${formId}-department`}
          name="department"
          options={departmentOptions}
          defaultValue={department}
          placeholder="All departments"
          searchPlaceholder="Search departments…"
          aria-label="Department"
        />
      </Field>

      <Field
        label="Service type"
        htmlFor={`${formId}-service-type`}
        hint="Every service of the selected department is shown."
      >
        <FormSelect
          variant="select"
          id={`${formId}-service-type`}
          name="service_type"
          options={serviceTypeOptions}
          defaultValue=""
          placeholder="All types"
          aria-label="Service type"
        />
      </Field>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-label font-medium text-ink">Location</legend>

        <Field label="State" htmlFor={`${formId}-state`}>
          <FormSelect
            variant="combobox"
            id={`${formId}-state`}
            name="state"
            options={stateOptions}
            defaultValue={state}
            placeholder="All states"
            searchPlaceholder="Search states…"
            aria-label="State"
          />
        </Field>

        <Field label="District" htmlFor={`${formId}-district`}>
          <FormSelect
            variant="combobox"
            id={`${formId}-district`}
            name="district"
            options={districtOptions}
            defaultValue={district}
            disabled={!hasState}
            placeholder={hasState ? "All districts" : "Choose a state first"}
            searchPlaceholder="Search districts…"
            aria-label="District"
          />
        </Field>

        <Field
          label="City / Office"
          htmlFor={`${formId}-city`}
          hint="Results are grouped by district."
        >
          <FormSelect
            variant="combobox"
            id={`${formId}-city`}
            name="city"
            options={cityOptions}
            defaultValue={city}
            disabled={!hasDistrict}
            placeholder={hasDistrict ? "All" : "Choose a district first"}
            searchPlaceholder="Search cities…"
            aria-label="City / Office"
          />
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
