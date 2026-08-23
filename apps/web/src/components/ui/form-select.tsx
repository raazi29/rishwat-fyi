"use client";

import { useState } from "react";

import { Combobox } from "./combobox";
import { CustomSelect } from "./custom-select";
import type { SelectOption } from "./select-types";

/**
 * Client bridge that lets the server-rendered, no-JS `<form method="get">`
 * filter forms drive the controlled {@link CustomSelect} / {@link Combobox}.
 *
 * It seeds its value from the server-provided `defaultValue` and lets the
 * underlying control render a synchronized hidden `<input name>`, so the form
 * still submits the *exact* query parameter (same name, same value) it did with
 * a native `<select>`. When the server default changes across a navigation —
 * "Apply filters" reloads the page, and "Clear all" is a client navigation —
 * the value re-seeds to match, keeping server-rendered defaults authoritative.
 *
 * A disabled control is barred from submission exactly like a disabled native
 * `<select>`: the hidden input is dropped so it contributes no query parameter
 * (e.g. District before a State is chosen).
 */
export interface FormSelectProps {
  /**
   * `"combobox"` adds an in-overlay search field for long lists (department,
   * state, district, city); `"select"` is a plain listbox for short lists.
   */
  variant?: "select" | "combobox";
  /** GET parameter name; also drives the synchronized hidden input. */
  name: string;
  /** Trigger id, associated with a `<label htmlFor>`. */
  id?: string;
  options: SelectOption[];
  /** Server-rendered selected value (`""` means nothing selected). */
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Combobox only: placeholder for the in-overlay search field. */
  searchPlaceholder?: string;
  /** Combobox only: message shown when there are no options at all. */
  emptyMessage?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}

export function FormSelect({
  variant = "select",
  defaultValue = "",
  disabled = false,
  name,
  searchPlaceholder,
  emptyMessage,
  ...rest
}: FormSelectProps) {
  const [value, setValue] = useState(defaultValue);

  // Re-seed when the server default changes across a navigation. Adjusting
  // state during render (rather than in an effect) is the documented React
  // pattern and avoids a flash of the stale value. Local selections made
  // between navigations are preserved because `defaultValue` only changes when
  // the server re-renders the form.
  const [seed, setSeed] = useState(defaultValue);
  if (seed !== defaultValue) {
    setSeed(defaultValue);
    setValue(defaultValue);
  }

  const shared = {
    ...rest,
    disabled,
    // Disabled controls are not submitted, mirroring a native disabled select.
    name: disabled ? undefined : name,
    value,
    onValueChange: setValue,
  };

  if (variant === "combobox") {
    return (
      <Combobox {...shared} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage} />
    );
  }

  return <CustomSelect {...shared} />;
}
