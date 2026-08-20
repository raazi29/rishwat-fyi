import { Checkbox, Field, NativeSelect, TextInput } from "@/components/ui";

import type { StepProps } from "../wizard-types";
import { DELAY_UNITS, type DelayUnit } from "../wizard-types";

/**
 * Step 3 — Payments & Visits. Every field here is optional; the reporter shares
 * only the numbers they remember. Money is entered in whole rupees (validated
 * against the shared `inrSchema` on advance), delay as a number plus a unit,
 * and visits as a whole count. Errors surface through `Field` (icon + message).
 */
export function StepPayments({ data, errors, set }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Official fee (₹)" hint="What the service officially costs" error={errors.officialFee}>
          {(control) => (
            <TextInput
              {...control}
              value={data.officialFee}
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 1000"
              onChange={(event) => set({ officialFee: event.target.value })}
            />
          )}
        </Field>

        <Field
          label="Additional amount requested (₹)"
          hint="Any amount beyond the official fee"
          error={errors.additionalAmount}
        >
          {(control) => (
            <TextInput
              {...control}
              value={data.additionalAmount}
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 2000"
              onChange={(event) => set({ additionalAmount: event.target.value })}
            />
          )}
        </Field>

        <Field label="Amount you paid (₹)" hint="Total you actually paid" error={errors.amountPaid}>
          {(control) => (
            <TextInput
              {...control}
              value={data.amountPaid}
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 3000"
              onChange={(event) => set({ amountPaid: event.target.value })}
            />
          )}
        </Field>

        <Field label="Number of visits" hint="How many times you had to go" error={errors.visits}>
          {(control) => (
            <TextInput
              {...control}
              value={data.visits}
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 3"
              onChange={(event) => set({ visits: event.target.value })}
            />
          )}
        </Field>

        <Field
          label="Delay experienced"
          hint="Beyond the official timeline"
          error={errors.delayValue}
          className="sm:col-span-2 sm:max-w-sm"
        >
          {(control) => (
            <div className="flex gap-2">
              <TextInput
                {...control}
                value={data.delayValue}
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 14"
                className="flex-1"
                onChange={(event) => set({ delayValue: event.target.value })}
              />
              <NativeSelect
                aria-label="Delay unit"
                value={data.delayUnit}
                className="w-32"
                onChange={(event) => set({ delayUnit: event.target.value as DelayUnit })}
              >
                {DELAY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
        </Field>
      </div>

      <div className="rounded-md bg-sunken px-3 py-1">
        <Checkbox
          name="paid"
          label="I paid this amount"
          description="Tick if you actually paid the amount above, not only that it was requested."
          checked={data.paid}
          onChange={(event) => set({ paid: event.target.checked })}
        />
      </div>
    </div>
  );
}
