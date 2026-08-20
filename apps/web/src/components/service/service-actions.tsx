"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { BookmarkIcon, CheckIcon, ShareIcon } from "@/components/icons";

/**
 * The service header's Share and Save actions — the smallest possible client
 * leaves. Share uses the Web Share API where available and falls back to
 * copying the link. Save toggles the slug in a localStorage list (no account,
 * no server, in keeping with the platform's minimal-data stance).
 */

const STORAGE_KEY = "rishwat:saved-services";

function readSaved(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ServiceActions({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(readSaved().includes(slug));
  }, [slug]);

  const onShare = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* User dismissed the share sheet — fall through to copy. */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable; nothing further we can safely do. */
    }
  };

  const onSave = () => {
    const list = readSaved();
    const next = list.includes(slug) ? list.filter((item) => item !== slug) : [...list, slug];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Storage disabled (private mode) — keep the in-memory state only. */
    }
    setSaved(next.includes(slug));
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={onShare}
        iconLeading={copied ? <CheckIcon size={18} /> : <ShareIcon size={18} />}
      >
        {copied ? "Link copied" : "Share"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onSave}
        aria-pressed={saved}
        iconLeading={<BookmarkIcon size={18} />}
      >
        {saved ? "Saved" : "Save"}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </>
  );
}
