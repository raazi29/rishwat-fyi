"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon } from "@/components/icons";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

import { OptionList } from "./option-list";
import { SelectOverlay, SHEET_MEDIA_QUERY } from "./select-overlay";
import {
  SELECT_TRIGGER_BASE,
  firstEnabledIndex,
  indexOfValue,
  isAriaInvalid,
  isTypeaheadKey,
  lastEnabledIndex,
  optionDomId,
  selectTriggerBorder,
  stepEnabledIndex,
  typeaheadIndex,
  type BaseSelectProps,
  type SelectOption,
} from "./select-types";

/**
 * A custom select for short lists (service type, time period, delay unit,
 * sort). Implements the WAI-ARIA 1.2 select-only combobox pattern: the trigger
 * is `role="combobox"` and keeps DOM focus, while a virtual cursor
 * (`aria-activedescendant`) moves through the listbox shown in the adaptive
 * overlay. Navigation is by arrows, Home/End, and type-ahead; Escape, outside
 * click, route change, and selection all close and leave focus on the trigger
 * (DESIGN.md §Accessibility).
 */
export type CustomSelectProps = BaseSelectProps;

export function CustomSelect({
  value,
  onValueChange,
  options,
  id,
  name,
  disabled = false,
  loading = false,
  placeholder = "Select…",
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}: CustomSelectProps) {
  const uid = useId();
  const listId = `${uid}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef<{ buffer: string; timer: number }>({ buffer: "", timer: 0 });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const sheet = useMediaQuery(SHEET_MEDIA_QUERY);
  const invalid = isAriaInvalid(ariaInvalid);
  const isDisabled = disabled || loading;
  const selectedIndex = indexOfValue(options, value);
  const selectedOption: SelectOption | undefined = options[selectedIndex];
  const overlayTitle = ariaLabel ?? placeholder;

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(
    (edge: "selected" | "last") => {
      if (isDisabled) return;
      const start =
        edge === "last"
          ? lastEnabledIndex(options)
          : selectedIndex >= 0 && !options[selectedIndex]?.disabled
            ? selectedIndex
            : firstEnabledIndex(options);
      setActiveIndex(start);
      setOpen(true);
    },
    [isDisabled, options, selectedIndex],
  );

  const runTypeahead = useCallback(
    (key: string, from: number): number => {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.buffer += key;
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.buffer = "";
      }, 600);
      return typeaheadIndex(options, typeahead.current.buffer, from);
    },
    [options],
  );

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onValueChange(option.value);
    },
    [onValueChange, options],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;

    if (!open) {
      switch (event.key) {
        case "ArrowDown":
        case "Enter":
        case " ":
          event.preventDefault();
          openMenu("selected");
          return;
        case "ArrowUp":
          event.preventDefault();
          openMenu("last");
          return;
        default:
          if (isTypeaheadKey(event)) {
            event.preventDefault();
            const next = runTypeahead(event.key, selectedIndex);
            if (next >= 0) selectIndex(next);
          }
          return;
      }
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => stepEnabledIndex(options, current, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => stepEnabledIndex(options, current, -1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(firstEnabledIndex(options));
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(lastEnabledIndex(options));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeIndex >= 0) {
          selectIndex(activeIndex);
          close();
        }
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        // Focus is on the trigger; let Tab move it away naturally, just dismiss.
        close();
        break;
      default:
        if (isTypeaheadKey(event)) {
          event.preventDefault();
          const next = runTypeahead(event.key, activeIndex);
          if (next >= 0) setActiveIndex(next);
        }
    }
  };

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
        aria-activedescendant={open && activeIndex >= 0 ? optionDomId(listId, activeIndex) : undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-invalid={invalid || undefined}
        aria-busy={loading || undefined}
        onClick={() => (open ? close() : openMenu("selected"))}
        onKeyDown={onKeyDown}
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
        <OptionList
          id={listId}
          options={options}
          selectedValue={value}
          activeIndex={activeIndex}
          onSelect={(option) => {
            onValueChange(option.value);
            close();
          }}
          onActiveChange={setActiveIndex}
          variant={sheet ? "sheet" : "popover"}
          ariaLabel={ariaLabel ?? placeholder}
          className="min-h-0 flex-1"
        />
      </SelectOverlay>
    </div>
  );
}
