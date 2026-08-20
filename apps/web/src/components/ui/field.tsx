"use client";

import { useId, useState, type ComponentPropsWithRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import { AlertIcon, ChevronDownIcon } from "@/components/icons";

/**
 * Form controls for the report wizard and the search filter rail. Every
 * control is 42px tall, 8px radius, hairline-bordered on white (DESIGN.md
 * §Components: input). Errors are carried by an icon and a message as well as
 * red, so colour is never the only signal (DESIGN.md §Colors rule 1).
 */

const CONTROL_BASE =
  "h-[42px] w-full rounded-md border bg-surface px-3 text-body text-ink transition-colors duration-150 " +
  "placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-muted " +
  "read-only:bg-sunken read-only:text-ink-secondary";

function borderFor(invalid: boolean): string {
  return invalid ? "border-reported" : "border-line hover:border-ink-muted";
}

function isInvalid(value: ComponentPropsWithRef<"input">["aria-invalid"]): boolean {
  return value === true || value === "true";
}

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Labelled field wrapper. Generates ids via useId and wires
 * `aria-describedby`/`aria-invalid` onto the control it renders. Pass a render
 * function to receive those props, guaranteeing correct association. The
 * required marker is red *and* announced, per the "never colour alone" rule.
 */
export function Field({
  label,
  required = false,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
}) {
  const uid = useId();
  const id = htmlFor ?? `field-${uid}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control: FieldControlProps = {
    id,
    "aria-describedby": describedBy,
    ...(error ? { "aria-invalid": true } : {}),
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label font-medium text-ink">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-reported">
              {" "}
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-label text-ink-muted">
          {hint}
        </p>
      ) : null}
      {typeof children === "function" ? children(control) : children}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-label text-reported">
          <AlertIcon size={16} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** Single-line text input with optional leading/trailing adornments. */
export function TextInput({
  leading,
  trailing,
  className,
  ...props
}: ComponentPropsWithRef<"input"> & { leading?: ReactNode; trailing?: ReactNode }) {
  const invalid = isInvalid(props["aria-invalid"]);
  const input = (
    <input
      className={cn(
        CONTROL_BASE,
        borderFor(invalid),
        leading ? "pl-9" : undefined,
        trailing ? "pr-9" : undefined,
        className,
      )}
      {...props}
    />
  );
  if (!leading && !trailing) return input;
  return (
    <div className="relative">
      {leading ? (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
          {leading}
        </span>
      ) : null}
      {input}
      {trailing ? (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

/** Multi-line input with a live character counter (report description field). */
export function Textarea({
  className,
  maxLength,
  showCount = true,
  onChange,
  ...props
}: ComponentPropsWithRef<"textarea"> & { showCount?: boolean }) {
  const initial =
    typeof props.value === "string"
      ? props.value.length
      : typeof props.defaultValue === "string"
        ? props.defaultValue.length
        : 0;
  const [innerCount, setInnerCount] = useState(initial);
  const count = typeof props.value === "string" ? props.value.length : innerCount;
  const invalid = isInvalid(props["aria-invalid"]);

  return (
    <div className="flex flex-col gap-1">
      <textarea
        maxLength={maxLength}
        className={cn(
          CONTROL_BASE,
          borderFor(invalid),
          "h-auto min-h-28 resize-y py-2.5 leading-relaxed",
          className,
        )}
        onChange={(event) => {
          setInnerCount(event.target.value.length);
          onChange?.(event);
        }}
        {...props}
      />
      {showCount && maxLength ? (
        <span className="self-end text-micro tabular text-ink-muted">
          {count} / {maxLength}
        </span>
      ) : null}
    </div>
  );
}

/** Native select styled to match, with an authored chevron. */
export function NativeSelect({
  className,
  children,
  ...props
}: ComponentPropsWithRef<"select">) {
  const invalid = isInvalid(props["aria-invalid"]);
  return (
    <div className="relative">
      <select
        className={cn(CONTROL_BASE, borderFor(invalid), "cursor-pointer appearance-none pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        size={18}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

/** Shared markup for a checkbox/radio row: clickable label, input, description. */
function OptionRow({
  type,
  label,
  description,
  id,
  className,
  ...props
}: ComponentPropsWithRef<"input"> & {
  type: "checkbox" | "radio";
  label: ReactNode;
  description?: ReactNode;
}) {
  const uid = useId();
  const cid = id ?? `${type}-${uid}`;
  return (
    <label
      htmlFor={cid}
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-2.5 py-1.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55",
        className,
      )}
    >
      <input id={cid} type={type} className="mt-0.5 size-[18px] shrink-0 accent-official" {...props} />
      <span className="min-w-0">
        <span className="block text-body text-ink">{label}</span>
        {description ? (
          <span className="block text-label text-ink-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

/** Checkbox with a clickable label row (the Experience step's "what happened"). */
export function Checkbox(
  props: Omit<ComponentPropsWithRef<"input">, "type"> & { label: ReactNode; description?: ReactNode },
) {
  return <OptionRow type="checkbox" {...props} />;
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/** A single radio row; usually rendered through RadioGroup. */
export function Radio(
  props: Omit<ComponentPropsWithRef<"input">, "type"> & { label: ReactNode; description?: ReactNode },
) {
  return <OptionRow type="radio" {...props} />;
}

/** A named group of radios (the search rail's "Sort by"). Fieldset semantics. */
export function RadioGroup({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  className,
}: {
  name: string;
  legend?: ReactNode;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col", className)}>
      {legend ? (
        <legend className="mb-1 text-label font-medium text-ink">{legend}</legend>
      ) : null}
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          {...(value !== undefined
            ? { checked: value === option.value }
            : { defaultChecked: defaultValue === option.value })}
          onChange={() => onValueChange?.(option.value)}
        />
      ))}
    </fieldset>
  );
}
