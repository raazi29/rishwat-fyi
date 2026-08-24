/**
 * Sentry error tracking for the web app. Mirrors the API's lib/sentry.ts: this
 * module owns an init call and a thin `captureException` wrapper so components
 * never import the SDK directly. With NEXT_PUBLIC_SENTRY_DSN unset every export
 * is an inert no-op and nothing is sent.
 *
 * The browser, Node server, and edge runtimes each get their own `Sentry.init`
 * from the sentry.{client,server,edge}.config.ts files that `withSentryConfig`
 * loads (next.config.ts). This module is the shared, runtime-agnostic capture
 * helper the app imports (e.g. app/global-error.tsx).
 */
import * as Sentry from "@sentry/nextjs";

// The DSN is inlined at build time (NEXT_PUBLIC_ prefix), so this gate is fixed
// per deploy — unset means Sentry is fully disabled for that build.
export const SENTRY_ENABLED = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // The web app deploys to Vercel, which exposes the deployed commit here so
    // events group by release.
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // Keeps production alerts separate from preview/staging noise.
    environment: process.env.NODE_ENV,
    // Sample 10% of traces; error capture is unaffected by this rate.
    tracesSampleRate: 0.1,
  });
}

/**
 * Report an error to Sentry, or do nothing when disabled. Used by the global
 * error boundary so a root-layout crash — which bypasses app/error.tsx — is
 * still captured.
 */
export function captureException(err: unknown): void {
  if (!SENTRY_ENABLED) return;
  Sentry.captureException(err);
}
