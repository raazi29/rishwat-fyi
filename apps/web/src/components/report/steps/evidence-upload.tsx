"use client";

import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { AlertIcon, CloseIcon, DocumentIcon } from "@/components/icons";

const MAX_BYTES = 20 * 1024 * 1024;
// Mirrors ALLOWED_MIME in apps/api/src/routes/evidence.ts. HEIC is included
// because that is what an iPhone camera produces by default; leaving it out
// silently blocked the most common photo on the platform.
const ACCEPT = "image/png,image/jpeg,image/webp,image/heic,application/pdf";
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Optional evidence attachment for the Description step. Evidence files are
 * private, reviewed by a moderator, and auto-deleted 90 days after upload
 * (PRODUCT.md) — all three are stated here. The file is validated for size and
 * type on the client and handed up to the wizard; it is attached to the report
 * on submission and can also be added later.
 */
export function EvidenceUpload({
  file,
  onSelect,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const descId = useId();

  const pick = (selected: File | null) => {
    if (!selected) {
      setError(null);
      onSelect(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("That file is larger than 20 MB. Choose a smaller screenshot, photo or PDF.");
      onSelect(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    // The API rejects anything outside the allow-list with a 400, and that
    // rejection would arrive after the report was already filed. Catch it here
    // instead, while the person can still choose another file.
    if (selected.type !== "" && !ACCEPTED_TYPES.has(selected.type)) {
      setError("That file type cannot be attached. Use a PNG, JPG, WebP, HEIC or PDF file.");
      onSelect(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    onSelect(selected);
  };

  return (
    <div className="space-y-2">
      <span className="text-label font-medium text-ink">Evidence (optional)</span>
      <p id={descId} className="text-label text-ink-muted">
        Screenshots, receipts or photos help verification. Files are private, reviewed only by a
        moderator, and automatically deleted 90 days after upload. Maximum 20 MB (PNG, JPG, WebP,
        HEIC or PDF). Do not upload anything showing your name or other personal details.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        aria-describedby={descId}
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-tile bg-sage text-official-mid">
            <DocumentIcon size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-label font-medium text-ink">{file.name}</span>
            <span className="block text-micro text-ink-muted">{formatBytes(file.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => pick(null)}
            aria-label={`Remove ${file.name}`}
            className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink"
          >
            <CloseIcon size={18} />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          iconLeading={<DocumentIcon size={18} />}
          onClick={() => inputRef.current?.click()}
        >
          Choose a file
        </Button>
      )}

      {error ? (
        <p className="flex items-start gap-1.5 text-label text-reported">
          <AlertIcon size={16} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
