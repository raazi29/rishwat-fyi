/**
 * Shared model and pure helpers for the custom control system (CustomSelect and
 * Combobox). This module is deliberately framework-free: no React, no DOM — so
 * the matching, filtering, and keyboard-navigation logic is unit-testable and
 * shared by both controls (DESIGN.md §Components: every interactive component
 * ships default/hover/focus/active/disabled/error states; §Colors rule 1:
 * errors carry an icon and text, never colour alone).
 */

/** One selectable option. `keywords` widen fuzzy search; `description` renders
 * as a secondary line beneath the label. */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
  disabled?: boolean;
}

/** Props common to CustomSelect and Combobox. Mirrors `FieldControlProps` so a
 * `Field` render callback can spread straight onto the trigger. */
export interface BaseSelectProps {
  /** The controlled selected value. Empty string means "nothing selected". */
  value: string;
  /** Called with the chosen option's value (or "" when cleared). */
  onValueChange: (value: string) => void;
  options: SelectOption[];
  /** Id for the trigger — associates a `<label htmlFor>` and is echoed on aria. */
  id?: string;
  /** When set, a synchronized hidden input is rendered so no-JS GET forms and
   * server actions still receive the value. */
  name?: string;
  disabled?: boolean;
  /** Show a disabled "loading" trigger (e.g. while geography loads). */
  loading?: boolean;
  placeholder?: string;
  className?: string;
  /** Accessible name when no visible `<label htmlFor>` is associated. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}

const SEARCH_LOCALE = "en-IN";

/** Case- and whitespace-insensitive fold used for matching (never for display).
 * Uses the `en-IN` locale so Indian place names case-fold predictably. */
export function foldForSearch(text: string): string {
  return text.toLocaleLowerCase(SEARCH_LOCALE).replace(/\s+/g, " ").trim();
}

/** Does an option match a free-text query across its label, description, and
 * keywords? An empty query matches everything. */
export function optionMatchesQuery(option: SelectOption, query: string): boolean {
  const needle = foldForSearch(query);
  if (!needle) return true;
  if (foldForSearch(option.label).includes(needle)) return true;
  if (option.description && foldForSearch(option.description).includes(needle)) return true;
  if (option.keywords) {
    for (const keyword of option.keywords) {
      if (foldForSearch(keyword).includes(needle)) return true;
    }
  }
  return false;
}

/** Filter options by query, preserving the caller's (already alphabetical) order. */
export function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  if (!query.trim()) return options;
  return options.filter((option) => optionMatchesQuery(option, query));
}

/** Index of the option whose value equals `value`, or -1. */
export function indexOfValue(options: SelectOption[], value: string): number {
  if (!value) return -1;
  return options.findIndex((option) => option.value === value);
}

/** First selectable (non-disabled) index, or -1 when every option is disabled. */
export function firstEnabledIndex(options: SelectOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

/** Last selectable (non-disabled) index, or -1. */
export function lastEnabledIndex(options: SelectOption[]): number {
  for (let i = options.length - 1; i >= 0; i -= 1) {
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

/**
 * Move to the next selectable index in `direction` (+1 down, -1 up), skipping
 * disabled options and clamping at the ends — matching native `<select>` arrow
 * behaviour, which does not wrap. Returns `from` when no move is possible.
 */
export function stepEnabledIndex(
  options: SelectOption[],
  from: number,
  direction: 1 | -1,
): number {
  if (options.length === 0) return -1;
  if (from < 0) return direction === 1 ? firstEnabledIndex(options) : lastEnabledIndex(options);
  let index = from;
  for (;;) {
    index += direction;
    if (index < 0 || index >= options.length) return from;
    if (!options[index]?.disabled) return index;
  }
}

/**
 * Type-ahead lookup used by CustomSelect: find the next enabled option whose
 * label starts with `buffer`. A single-character buffer cycles to the option
 * *after* `from`; a multi-character buffer keeps the current match so "kar"
 * stays on "Karnataka" while it is being typed. Search wraps. Returns -1 when
 * nothing matches.
 */
export function typeaheadIndex(options: SelectOption[], buffer: string, from: number): number {
  const needle = foldForSearch(buffer);
  const count = options.length;
  if (!needle || count === 0) return -1;
  const startOffset = buffer.length > 1 ? 0 : 1;
  const base = from < 0 ? -1 : from;
  for (let step = 0; step < count; step += 1) {
    const index = (((base + startOffset + step) % count) + count) % count;
    const option = options[index];
    if (option && !option.disabled && foldForSearch(option.label).startsWith(needle)) {
      return index;
    }
  }
  return -1;
}

/** Whether a keydown is a printable single character usable for type-ahead. */
export function isTypeaheadKey(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

/** Normalize the `aria-invalid` prop (which may be a string) to a boolean. */
export function isAriaInvalid(value: BaseSelectProps["aria-invalid"]): boolean {
  return value === true || value === "true";
}

/** Stable DOM id for an option row, so the focused element can point at it via
 * `aria-activedescendant`. */
export function optionDomId(listId: string, index: number): string {
  return `${listId}-opt-${index}`;
}

/**
 * Trigger visual language, matching the shared form control (Field §input:
 * 8px radius, hairline border on white). Kept at least 44px tall for touch
 * (DESIGN.md §Accessibility) rather than the 42px text-input height.
 */
export const SELECT_TRIGGER_BASE =
  "flex min-h-11 w-full items-center gap-2 rounded-md border bg-surface px-3 text-left text-body " +
  "text-ink transition-colors duration-150 disabled:cursor-not-allowed disabled:border-line " +
  "disabled:bg-sunken disabled:text-ink-muted";

/** Border treatment for the trigger: red hairline when invalid, else the
 * standard hover-darkening hairline. */
export function selectTriggerBorder(invalid: boolean): string {
  return invalid ? "border-reported" : "border-line hover:border-ink-muted";
}
