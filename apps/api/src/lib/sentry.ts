/**
 * Sentry initialization stub for the Hono API. When SENTRY_DSN is set,
 * initialize Sentry here.
 *
 * To fully enable:
 * 1. npm install @sentry/node -w apps/api
 * 2. Call Sentry.init({ dsn: process.env.SENTRY_DSN }) in this file
 * 3. Add Sentry.captureException(err) in the global error handler (app.ts onError)
 * 4. Set SENTRY_DSN in your environment
 */
export const SENTRY_ENABLED = !!process.env.SENTRY_DSN;
