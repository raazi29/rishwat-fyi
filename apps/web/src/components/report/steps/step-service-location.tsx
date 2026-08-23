import { useMemo } from "react";

import {
  Callout,
  Combobox,
  CustomSelect,
  Field,
  TextInput,
  type SelectOption,
} from "@/components/ui";
import { ChevronDownIcon, ShieldCheckIcon } from "@/components/icons";

import type { PeriodKey, StepProps } from "../wizard-types";
import { FREQUENCY_OPTIONS, PERIOD_OPTIONS, SERVICE_TYPE_OPTIONS } from "../wizard-types";

/**
 * Step 1 — Service & location. Reorganised into three sequential groups
 * (Service, Place, When) with at most two columns, and progressive disclosure:
 * only the required controls plus the optional city show first, while service
 * type, office name, and frequency live under "Add more detail (optional)"
 * (design spec §Step 1 hierarchy).
 *
 * Long lists (department, service, state, district, city) use the searchable
 * `Combobox`; short lists (period, service type, frequency) use `CustomSelect`.
 * Options consume the entire `WizardGeo` tree — every state/UT, district, and
 * city the API returned — and are defensively sorted by label with
 * `localeCompare("en-IN")` so display order never depends on API ordering.
 *
 * Cascading resets are preserved: choosing a department clears a now-mismatched
 * service; choosing a state clears its district and city; choosing a district
 * clears its city.
 */

/** Sort a copy of `options` by label using the Indian English collation. */
function sortByLabel(options: SelectOption[]): SelectOption[] {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, "en-IN"));
}

/** Wrap a fixed, order-significant string list (e.g. period) as options. */
function toOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export function StepServiceLocation({ data, errors, geo, set }: StepProps) {
  const departmentOptions = useMemo<SelectOption[]>(
    () => sortByLabel(geo.departments.map((d) => ({ value: d.slug, label: d.name }))),
    [geo.departments],
  );

  const serviceOptions = useMemo<SelectOption[]>(() => {
    const source = data.departmentSlug
      ? geo.services.filter((service) => service.departmentSlug === data.departmentSlug)
      : geo.services;
    return sortByLabel(
      source.map((service) => ({
        value: service.slug,
        label: service.name,
        description: service.department,
      })),
    );
  }, [geo.services, data.departmentSlug]);

  const stateOptions = useMemo<SelectOption[]>(
    () => sortByLabel(geo.states.map((s) => ({ value: s.code, label: s.name }))),
    [geo.states],
  );

  const districtOptions = useMemo<SelectOption[]>(() => {
    const districts = data.stateCode ? geo.districtsByState[data.stateCode] ?? [] : [];
    return sortByLabel(districts.map((d) => ({ value: d.id, label: d.name })));
  }, [geo.districtsByState, data.stateCode]);

  const cityOptions = useMemo<SelectOption[]>(() => {
    const cities = data.districtId ? geo.citiesByDistrict[data.districtId] ?? [] : [];
    return sortByLabel(cities.map((c) => ({ value: c.id, label: c.name })));
  }, [geo.citiesByDistrict, data.districtId]);

  const periodOptions = useMemo<SelectOption[]>(
    () => PERIOD_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );
  const serviceTypeOptions = useMemo(() => toOptions(SERVICE_TYPE_OPTIONS), []);
  const frequencyOptions = useMemo(() => toOptions(FREQUENCY_OPTIONS), []);

  // Selecting a department drops a service that no longer sits under it; an
  // empty department (cleared) leaves any chosen service untouched.
  const onDepartment = (slug: string) => {
    const stillValid =
      !slug ||
      geo.services.some((service) => service.slug === data.serviceSlug && service.departmentSlug === slug);
    set({ departmentSlug: slug, ...(stillValid ? {} : { serviceSlug: "" }) });
  };

  return (
    <div className="space-y-6">
      {/* Group: Service */}
      <div className="space-y-3">
        <h3 className="font-sans text-body font-semibold text-ink">Service</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department / Ministry" required error={errors.departmentSlug}>
            {(control) => (
              <Combobox
                {...control}
                aria-label="Department / Ministry"
                value={data.departmentSlug}
                onValueChange={onDepartment}
                options={departmentOptions}
                placeholder="Select department"
                searchPlaceholder="Search departments…"
              />
            )}
          </Field>

          <Field label="Service" required error={errors.serviceSlug}>
            {(control) => (
              <Combobox
                {...control}
                aria-label="Service"
                value={data.serviceSlug}
                onValueChange={(value) => set({ serviceSlug: value })}
                options={serviceOptions}
                placeholder="Select service"
                searchPlaceholder="Search services…"
              />
            )}
          </Field>
        </div>
      </div>

      {/* Group: Place */}
      <div className="space-y-3">
        <h3 className="font-sans text-body font-semibold text-ink">Place</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State" required error={errors.stateCode}>
            {(control) => (
              <Combobox
                {...control}
                aria-label="State"
                value={data.stateCode}
                onValueChange={(value) => set({ stateCode: value, districtId: "", cityId: "" })}
                options={stateOptions}
                placeholder="Select state"
                searchPlaceholder="Search states…"
              />
            )}
          </Field>

          <Field label="District" required error={errors.districtId}>
            {(control) => (
              <Combobox
                {...control}
                aria-label="District"
                value={data.districtId}
                onValueChange={(value) => set({ districtId: value, cityId: "" })}
                options={districtOptions}
                disabled={!data.stateCode}
                placeholder={data.stateCode ? "Select district" : "Select a state first"}
                searchPlaceholder="Search districts…"
              />
            )}
          </Field>

          <Field label="City" hint="Optional" error={errors.cityId}>
            {(control) => (
              <Combobox
                {...control}
                aria-label="City"
                value={data.cityId}
                onValueChange={(value) => set({ cityId: value })}
                options={cityOptions}
                disabled={!data.districtId}
                placeholder={data.districtId ? "Select city (optional)" : "Select a district first"}
                searchPlaceholder="Search cities…"
              />
            )}
          </Field>
        </div>
      </div>

      {/* Group: When */}
      <div className="space-y-3">
        <h3 className="font-sans text-body font-semibold text-ink">When</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="When did this happen?" required error={errors.period}>
            {(control) => (
              <CustomSelect
                {...control}
                aria-label="When did this happen?"
                value={data.period}
                onValueChange={(value) => set({ period: value as PeriodKey })}
                options={periodOptions}
                placeholder="Select date or period"
              />
            )}
          </Field>
        </div>
      </div>

      {/* Optional detail — hidden until asked for so Step 1 stays scannable. */}
      <details className="group rounded-lg border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-label font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Add more detail (optional)
          <ChevronDownIcon
            size={18}
            aria-hidden="true"
            className="shrink-0 text-ink-muted transition-transform duration-150 group-open:rotate-180"
          />
        </summary>
        <div className="grid gap-4 border-t border-line-inner p-4 sm:grid-cols-2">
          <Field label="Service type" hint="Optional">
            {(control) => (
              <CustomSelect
                {...control}
                aria-label="Service type"
                value={data.serviceType}
                onValueChange={(value) => set({ serviceType: value })}
                options={serviceTypeOptions}
                placeholder="Select type"
              />
            )}
          </Field>

          <Field label="Office name" hint="Optional" htmlFor="report-office">
            <TextInput
              id="report-office"
              value={data.office}
              placeholder="e.g. RTO, Varanasi"
              autoComplete="off"
              onChange={(event) => set({ office: event.target.value })}
            />
          </Field>

          <Field label="How often have you faced this?" hint="Optional">
            {(control) => (
              <CustomSelect
                {...control}
                aria-label="How often have you faced this?"
                value={data.frequency}
                onValueChange={(value) => set({ frequency: value })}
                options={frequencyOptions}
                placeholder="Select frequency"
              />
            )}
          </Field>
        </div>
      </details>

      <Callout tone="official" icon={<ShieldCheckIcon size={20} />} title="Stay safe">
        Do not include names of officials or other personal information in your report.
      </Callout>
    </div>
  );
}
