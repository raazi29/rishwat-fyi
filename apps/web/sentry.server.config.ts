// Node server-runtime Sentry init (Server Components, route handlers, Server
// Actions). Loaded by withSentryConfig (next.config.ts), and only when
// NEXT_PUBLIC_SENTRY_DSN is set. The browser-only Session Replay options are
// omitted here — they have no effect outside the browser.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
