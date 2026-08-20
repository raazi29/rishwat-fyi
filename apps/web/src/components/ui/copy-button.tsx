"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";
import { CheckIcon, CopyIcon } from "@/components/icons";

/**
 * Copies a value to the clipboard and confirms with "Copied" for two seconds.
 * Falls back to a hidden-textarea `execCommand` copy when the async clipboard
 * API is unavailable. Used for the report ID on the submitted page and for API
 * paths in the docs. The confirmation is announced via an aria-live region.
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  showLabel = true,
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flash = () => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  const onCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
      flash();
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        flash();
      } catch {
        /* Selection remains for a manual copy. */
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? copiedLabel : `${label}: ${value}`}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface text-label font-medium text-ink transition-colors duration-150 hover:bg-sunken active:bg-sunken",
        showLabel ? "px-3" : "min-w-11",
        className,
      )}
    >
      {copied ? (
        <CheckIcon size={18} className="text-official-mid" />
      ) : (
        <CopyIcon size={18} className="text-ink-muted" />
      )}
      {showLabel ? <span>{copied ? copiedLabel : label}</span> : null}
      <span aria-live="polite" className="sr-only">
        {copied ? `${copiedLabel} to clipboard` : ""}
      </span>
    </button>
  );
}
