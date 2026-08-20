import { useMemo } from "react";

import { Callout, Field, NativeSelect, TextInput } from "@/components/ui";
import { ShieldCheckIcon } from "@/components/icons";

import type { StepProps } from "../wizard-types";
import { FREQUENCY_OPTIONS, PERIOD_OPTIONS, SERVICE_TYPE_OPTIONS } from "../wizard-types";

/**
 * Step 1 — Service & Location. Cascading selects: choosing a department filters
 * the service list; choosing a state resets its district and city; choosing a
 * district resets its city. Every select is a reused `NativeSelect` (keyboard
 * accessible, no custom combobox) wired through `Field` for correct
 * label / error / aria association.
 */
export function StepServiceLocation({ data, errors, geo, set }: StepProps) {
  const services = useMemo(() => {
    if (!data.departmentSlug) return geo.services;
    return geo.services.filter((service) => service.departmentSlug === data.departmentSlug);
  }, [geo.services, data.departmentSlug]);

  const districts = data.stateCode ? geo.districtsByState[data.stateCode] ?? [] : [];
  const cities = data.districtId ? geo.citiesByDistrict[data.districtId] ?? [] : [];

  const onDepartment = (slug: string) => {
    const stillValid = geo.services.some(
      (service) => service.slug === data.serviceSlug && service.departmentSlug === slug,
    );
    set({ departmentSlug: slug, ...(stillValid ? {} : { serviceSlug: "" }) });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Department / Ministry" required error={errors.departmentSlug}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.departmentSlug}
              onChange={(event) => onDepartment(event.target.value)}
            >
              <option value="">Select department</option>
              {geo.departments.map((department) => (
                <option key={department.slug} value={department.slug}>
                  {department.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="Service" required error={errors.serviceSlug}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.serviceSlug}
              onChange={(event) => set({ serviceSlug: event.target.value })}
            >
              <option value="">Search or select service</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="Service type" hint="Optional">
          {(control) => (
            <NativeSelect
              {...control}
              value={data.serviceType}
              onChange={(event) => set({ serviceType: event.target.value })}
            >
              <option value="">Select type (optional)</option>
              {SERVICE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="State" required error={errors.stateCode}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.stateCode}
              onChange={(event) => set({ stateCode: event.target.value, districtId: "", cityId: "" })}
            >
              <option value="">Select state</option>
              {geo.states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="District" required error={errors.districtId}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.districtId}
              disabled={!data.stateCode}
              onChange={(event) => set({ districtId: event.target.value, cityId: "" })}
            >
              <option value="">{data.stateCode ? "Select district" : "Select a state first"}</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="City / Office" required error={errors.cityId}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.cityId}
              disabled={!data.districtId}
              onChange={(event) => set({ cityId: event.target.value })}
            >
              <option value="">{data.districtId ? "Select city or office" : "Select a district first"}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="If office known (optional)" htmlFor="report-office">
          <TextInput
            id="report-office"
            value={data.office}
            placeholder="e.g. RTO, Varanasi"
            autoComplete="off"
            onChange={(event) => set({ office: event.target.value })}
          />
        </Field>

        <Field label="When did this happen?" required error={errors.period}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.period}
              onChange={(event) => set({ period: event.target.value as typeof data.period })}
            >
              <option value="">Select date or period</option>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field label="How often have you faced this?" required error={errors.frequency}>
          {(control) => (
            <NativeSelect
              {...control}
              value={data.frequency}
              onChange={(event) => set({ frequency: event.target.value })}
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>

      <Callout tone="official" icon={<ShieldCheckIcon size={20} />} title="Stay safe">
        Do not include names of officials or other personal information in your report.
      </Callout>
    </div>
  );
}
