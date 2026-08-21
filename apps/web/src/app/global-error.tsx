"use client";

import { useEffect, type CSSProperties } from "react";

import "./globals.css";

/**
 * Last-resort boundary. This replaces the root layout — it must ship its own
 * `<html>` and `<body>` — and it renders precisely when that layout failed, so
 * it deliberately depends on nothing the layout provides: no header, no fonts
 * loaded through `next/font`, no shared components. Markup and classes are
 * inlined rather than imported, because a fallback that imports the code that
 * just crashed is not a fallback.
 *
 * Tone follows `app/error.tsx`: neutral, never red — red belongs to the
 * citizen-reported data channel (DESIGN.md §Colors rule 1) — no stack trace for
 * the reader, and the digest logged for operators.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the operator's console/log pipeline, never to the reader.
    console.error("Unhandled application error", error);
  }, [error]);

  /**
   * The `next/font` variables are set by the root layout, which is exactly what
   * is missing here, so the type scale falls back to the system faces named in
   * DESIGN.md rather than collapsing to the browser default.
   */
  const fontFallbacks = {
    "--font-source-serif": "Georgia",
    "--font-public-sans": "system-ui",
    "--font-jetbrains-mono": "ui-monospace",
  } as CSSProperties;

  return (
    <html lang="en-IN" style={fontFallbacks}>
      <body className="min-h-dvh bg-paper text-ink-secondary antialiased">
        <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center lg:py-24">
          <span
            aria-hidden="true"
            className="inline-flex size-12 items-center justify-center rounded-tile bg-sand text-official-mid"
          >
            <svg
              width={26}
              height={26}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              focusable="false"
            >
              <path d="M12 4.5 21 19.5H3z" />
              <path d="M12 10v4M12 16.8h.01" />
            </svg>
          </span>
          <h1 className="mt-5 font-serif text-h1 font-bold text-ink">Something went wrong</h1>
          <p className="mt-3 max-w-[52ch] text-body-lg text-ink-secondary">
            The site could not be displayed just now. The problem has been logged. You can try again,
            or reload the home page.
          </p>

          {error.digest ? (
            <p className="mt-3 font-mono text-label text-ink-muted">Reference: {error.digest}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-official px-4 text-label font-medium text-white transition-colors duration-150 hover:bg-official-deep"
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4.5V10h-5.5" />
              </svg>
              <span>Try again</span>
            </button>
            {/* A plain anchor, not a router link: after a root-layout failure a
                full document load is the reliable way back, and `next/link`
                would attempt a client navigation into the tree that just
                crashed. This is the one place the rule is wrong. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-label font-medium text-ink transition-colors duration-150 hover:bg-sunken"
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
              </svg>
              <span>Back to home</span>
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
