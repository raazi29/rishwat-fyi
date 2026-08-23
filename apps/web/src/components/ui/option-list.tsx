"use client";

import { useEffect, type KeyboardEventHandler, type ReactNode, type Ref } from "react";

import { cn } from "@/lib/utils/cn";
import { CheckIcon } from "@/components/icons";

import { optionDomId, type SelectOption } from "./select-types";

/**
 * The listbox rendered inside the adaptive overlay for both CustomSelect and
 * Combobox. It owns option presentation only — active/selected/disabled rows,
 * the empty/no-results message, and scrolling the active option into view —
 * while the parent control owns state and keyboard handling. Rows are 44px on
 * the desktop popover and 48px in the mobile sheet (DESIGN.md §Accessibility:
 * touch targets ≥44px; §Responsive: 48px option rows on phones).
 */
export interface OptionListProps {
  /** Id used for the `<ul role="listbox">` and to derive each option id. */
  id: string;
  /** Already-filtered options in display order. */
  options: SelectOption[];
  selectedValue: string;
  /** Index of the active (virtually focused) option, or -1. */
  activeIndex: number;
  onSelect: (option: SelectOption) => void;
  /** Pointer movement over a row promotes it to active (never on scroll). */
  onActiveChange?: (index: number) => void;
  variant: "popover" | "sheet";
  /** Shown when there are no options. Distinguish empty vs no-results upstream. */
  emptyMessage?: ReactNode;
  ariaLabel?: string;
  /** Set when the list itself holds DOM focus (CustomSelect). */
  ariaActiveDescendant?: string;
  tabIndex?: number;
  onKeyDown?: KeyboardEventHandler<HTMLUListElement>;
  listRef?: Ref<HTMLUListElement>;
  className?: string;
}

export function OptionList({
  id,
  options,
  selectedValue,
  activeIndex,
  onSelect,
  onActiveChange,
  variant,
  emptyMessage = "No options available",
  ariaLabel,
  ariaActiveDescendant,
  tabIndex,
  onKeyDown,
  listRef,
  className,
}: OptionListProps) {
  // Keep the active option visible as the user arrows or types through a long
  // list (states, districts). `block: "nearest"` avoids jumpy recentering.
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(optionDomId(id, activeIndex));
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id]);

  if (options.length === 0) {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center justify-center px-3 py-8 text-center text-body text-ink-muted",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={activeIndex >= 0 ? ariaActiveDescendant : undefined}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      className={cn(
        "m-0 list-none overflow-y-auto overscroll-contain p-1 focus-visible:outline-none",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === selectedValue;
        const active = index === activeIndex;
        return (
          <li
            key={option.value}
            id={optionDomId(id, index)}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            onPointerMove={option.disabled ? undefined : () => onActiveChange?.(index)}
            onClick={option.disabled ? undefined : () => onSelect(option)}
            className={cn(
              "flex scroll-my-1 items-start gap-2.5 rounded-sm px-2.5 text-body",
              variant === "sheet" ? "min-h-12 py-2.5" : "min-h-11 py-2",
              option.disabled
                ? "cursor-not-allowed text-ink-muted opacity-60"
                : cn("cursor-pointer", active ? "bg-sunken text-ink" : "text-ink-secondary"),
            )}
          >
            <span
              aria-hidden="true"
              className="flex w-5 shrink-0 items-center justify-center pt-0.5 text-official-mid"
            >
              {selected ? <CheckIcon size={18} /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate", selected ? "font-semibold text-ink" : undefined)}>
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-label text-ink-muted">{option.description}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
