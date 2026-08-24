"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { captureException } from "@/lib/sentry";

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
 * the reader, and the digest logged for operators. The offline illustration
 * only appears when the browser itself is offline; any other failure (the
 * common case — a render or data error with a live connection) shows a plain
 * alert glyph instead, so the artwork never misreports a connectivity issue.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Surfaced to the operator's console/log pipeline, never to the reader.
    console.error("Unhandled application error", error);
    // A root-layout failure lands here, not in app/error.tsx, so this boundary
    // is the only place that can report it. No-op unless NEXT_PUBLIC_SENTRY_DSN
    // is set.
    captureException(error);
  }, [error]);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
          {offline ? (
            // A plain <img>, not next/image: this boundary replaces the root
            // layout and must depend on nothing it provides.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand/illustration-offline.webp"
              alt=""
              width={340}
              height={227}
              className="h-auto w-full max-w-[340px] rounded-lg border border-line"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-sand text-official-mid">
              <svg
                width={30}
                height={30}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 9v4M12 16.5h.01" />
                <path d="M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
              </svg>
            </div>
          )}
          <h1 className="mt-6 font-serif text-h1 font-bold text-ink">
            {offline ? "No internet connection" : "Something went wrong"}
          </h1>
          <p className="mt-3 max-w-[52ch] text-body-lg text-ink-secondary">
            {offline
              ? "You appear to be offline. Reconnect and try again — a previously loaded page may still work."
              : "The site could not be displayed just now. The problem has been logged. You can try again, or reload the home page."}
          </p>

          {error.digest ? (
            <p className="mt-3 font-mono text-label text-ink-muted">Reference: {error.digest}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-official px-4 text-label font-medium text-white transition-colors duration-150 hover:bg-official-deep"
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-label font-medium text-ink transition-colors duration-150 hover:bg-sunken"
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
