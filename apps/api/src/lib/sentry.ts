/**
 * Sentry error tracking for the Hono API. This module owns the single
 * `Sentry.init` call and exposes a thin `captureException` wrapper, so the rest
 * of the codebase never imports the SDK directly. When SENTRY_DSN is unset — the
 * default in dev, tests, and any deploy that opts out — every export below is an
 * inert no-op and nothing is sent over the network.
 */
import * as Sentry from "@sentry/node";

// A DSN is the single signal that error reporting is wanted. Without it we skip
// init entirely rather than start a client that would quietly buffer then drop
// events, which keeps dev and CI free of Sentry side effects.
export const SENTRY_ENABLED = !!process.env.SENTRY_DSN;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Tie every event to the exact deployed commit so a regression can be traced
    // to a release and marked resolved on the next deploy. Render exposes
    // RENDER_GIT_COMMIT; the Vercel API entry exposes VERCEL_GIT_COMMIT_SHA —
    // read whichever the current platform set.
    release: process.env.RENDER_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA,
    // Keeps production alerts separate from preview/staging noise.
    environment: process.env.NODE_ENV,
    // Sample 10% of traces — enough to catch latency regressions without paying
    // to ingest a span for every request. Error capture is unaffected by this.
    tracesSampleRate: 0.1,
  });
}

/**
 * Report an unexpected error to Sentry, or do nothing when disabled. Only the
 * API's global `onError` internal-error branch calls this: expected control flow
 * (AppError, HTTPException) is deliberately never captured, so this stays silent
 * unless something genuinely broke.
 */
export function captureException(err: unknown): void {
  if (!SENTRY_ENABLED) return;
  Sentry.captureException(err);
}
