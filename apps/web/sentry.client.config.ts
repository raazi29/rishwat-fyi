// Browser-runtime Sentry init. Loaded into the client bundle by withSentryConfig
// (next.config.ts), and only when NEXT_PUBLIC_SENTRY_DSN is set — an
// unconfigured build ships no Sentry client. Session Replay is left off
// (replaysSessionSampleRate: 0) for reader privacy; only error-triggered
// replays are sampled.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
});
