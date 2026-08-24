// Edge-runtime Sentry init (middleware and any `export const runtime = "edge"`
// routes). Loaded by withSentryConfig (next.config.ts), and only when
// NEXT_PUBLIC_SENTRY_DSN is set. The edge runtime is a constrained V8 isolate,
// so this stays to the portable dsn + trace sampling and omits the browser-only
// Session Replay options.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
