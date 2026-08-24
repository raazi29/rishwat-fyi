/**
 * Sentry client initialization stub. When NEXT_PUBLIC_SENTRY_DSN is set,
 * initialize Sentry here. Until then this file is a no-op placeholder
 * that documents the integration point.
 *
 * To fully enable:
 * 1. npm install @sentry/nextjs -w apps/web
 * 2. Run `npx @sentry/wizard@latest -i nextjs`
 * 3. Set NEXT_PUBLIC_SENTRY_DSN and SENTRY_DSN in your environment
 */
export const SENTRY_ENABLED = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
