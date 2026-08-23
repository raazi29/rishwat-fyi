"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon, SearchIcon } from "@/components/icons";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

import { OptionList } from "./option-list";
import { SelectOverlay, SHEET_MEDIA_QUERY } from "./select-overlay";
import {
  SELECT_TRIGGER_BASE,
  filterOptions,
  firstEnabledIndex,
  indexOfValue,
  isAriaInvalid,
  optionDomId,
  selectTriggerBorder,
  stepEnabledIndex,
  type BaseSelectProps,
  type SelectOption,
} from "./select-types";

/**
 * A searchable combobox for long lists (department, service, state, district,
 * city). The trigger matches the shared form control; opening reveals a search
 * field above the listbox inside the adaptive overlay. Typing filters with
 * `en-IN` case-insensitive matching across label, description, and keywords,
 * and the result count is announced politely. Focus moves to the search field
 * on open and returns to the trigger on close (DESIGN.md §Components:
 * SearchableCombobox; §Accessibility).
 */
export interface ComboboxProps extends BaseSelectProps {
  /** Placeholder for the in-overlay search field. */
  searchPlaceholder?: string;
  /** Message when the control has no options at all (vs. no search matches). */
  emptyMessage?: string;
}

export function Combobox({
  value,
  onValueChange,
  options,
  id,
  name,
  disabled = false,
  loading = false,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No options available",
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}: ComboboxProps) {
  const uid = useId();
  const listId = `${uid}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const sheet = useMediaQuery(SHEET_MEDIA_QUERY);
  const invalid = isAriaInvalid(ariaInvalid);
  const isDisabled = disabled || loading;
  const selectedOption: SelectOption | undefined = options[indexOfValue(options, value)];
  const filtered = filterOptions(options, query);
  const overlayTitle = ariaLabel ?? placeholder;
  const activeDescendant =
    activeIndex >= 0 && activeIndex < filtered.length ? optionDomId(listId, activeIndex) : undefined;

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    if (isDisabled) return;
    setQuery("");
    const selected = indexOfValue(options, value);
    setActiveIndex(selected >= 0 && !options[selected]?.disabled ? selected : firstEnabledIndex(options));
    setOpen(true);
  }, [isDisabled, options, value]);

  // Focus the search field on open so typing filters immediately.
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const commitActive = useCallback(() => {
    const option = filtered[activeIndex];
    if (!option || option.disabled) return;
    onValueChange(option.value);
    close();
  }, [activeIndex, close, filtered, onValueChange]);

  const onQueryChange = (next: string) => {
    setQuery(next);
    setActiveIndex(firstEnabledIndex(filterOptions(options, next)));
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => stepEnabledIndex(filtered, current, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => stepEnabledIndex(filtered, current, -1));
        break;
      case "Enter":
        event.preventDefault();
        commitActive();
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        // Let focus leave the overlay naturally; just dismiss it.
        close();
        break;
      default:
        break;
    }
  };

  const resultAnnouncement =
    filtered.length === 0
      ? "No results"
      : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={isDisabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-invalid={invalid || undefined}
        aria-busy={loading || undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(event) => {
          if (isDisabled || open) return;
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
          }
        }}
        className={cn(SELECT_TRIGGER_BASE, selectTriggerBorder(invalid), className)}
      >
        <span
          className={cn("min-w-0 flex-1 truncate", selectedOption ? "text-ink" : "text-ink-muted")}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon
          size={18}
          className={cn(
            "shrink-0 text-ink-muted transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      {name ? <input type="hidden" name={name} value={value} /> : null}

      <SelectOverlay
        open={open}
        sheet={sheet}
        onClose={close}
        triggerRef={triggerRef}
        title={overlayTitle}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line-inner px-3">
          <SearchIcon size={18} className="shrink-0 text-ink-muted" />
          <input
            ref={searchRef}
            type="text"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            aria-label={`Search ${ariaLabel ?? placeholder}`}
            value={query}
            placeholder={searchPlaceholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
            className="h-11 w-full min-w-0 bg-transparent text-body text-ink placeholder:text-ink-muted focus-visible:outline-none"
          />
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          {resultAnnouncement}
        </div>

        <OptionList
          id={listId}
          options={filtered}
          selectedValue={value}
          activeIndex={activeIndex}
          onSelect={(option) => {
            onValueChange(option.value);
            close();
          }}
          onActiveChange={setActiveIndex}
          variant={sheet ? "sheet" : "popover"}
          ariaLabel={ariaLabel ?? placeholder}
          emptyMessage={query.trim() ? `No matches for “${query.trim()}”` : emptyMessage}
          className="min-h-0 flex-1"
        />
      </SelectOverlay>
    </div>
  );
}
