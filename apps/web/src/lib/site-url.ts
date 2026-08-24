/**
 * The canonical origin of this deployment.
 *
 * Used for `metadataBase` (which every canonical link and Open Graph image URL
 * is resolved against), `robots.txt` and `sitemap.xml`. Getting it wrong is not
 * a visible error — it just publishes several hundred `http://localhost:3000`
 * URLs to search engines and quietly de-indexes the site — so the resolution
 * order below fills it in from the platform before it ever falls back.
 *
 * The primary instance's canonical production origin is `https://rishwat.fyi`
 * (the Vercel-served web app). The API is a *separate* origin —
 * `https://api.rishwat.fyi`, a Render host — and must never appear here: a
 * canonical pointing at the API domain (or at a raw `*.onrender.com` host) would
 * de-index the real site. Mirrors (docs/mirroring.md) set this to their own
 * domain instead.
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — set this explicitly for a custom domain; in
 *    production the primary instance sets it to `https://rishwat.fyi`.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — injected by Vercel, the project's stable
 *    production domain (not the per-deployment URL). A correct absolute origin
 *    beats a localhost placeholder even when step 1 was forgotten.
 * 3. `http://localhost:3000` — local development only.
 *
 * Note this is resolved at BUILD time: `NEXT_PUBLIC_*` values are inlined by the
 * compiler, and robots/sitemap are prerendered. Changing it in a hosting
 * dashboard requires a redeploy to take effect.
 */

/**
 * The canonical production origin of the primary instance — the single source
 * of truth for this value in code, and what docs/deployment.md tells you to set
 * `NEXT_PUBLIC_SITE_URL` to on Vercel. Mirrors override it with their own domain.
 */
export const CANONICAL_PRODUCTION_URL = "https://rishwat.fyi";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit !== undefined && explicit !== "") return explicit;

  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelDomain !== undefined && vercelDomain !== "") return `https://${vercelDomain}`;

  return "http://localhost:3000";
}

/** Absolute origin, no trailing slash. */
export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");

/**
 * Warn — at build time — when a real production deploy resolves to an origin
 * that will quietly damage SEO. Unlike a missing API origin, which breaks the
 * site outright and therefore *throws* in apps/web/next.config.ts, a wrong
 * canonical still renders; it just publishes the wrong URLs to search engines.
 * So this is a loud warning in the build log, not a hard failure.
 *
 * Scoped to VERCEL_ENV=production so CI (which sets no such env) and local
 * `next build` stay silent — matching the scoping in next.config.ts. The checks
 * below flag values that are wrong for ANY deployment, so this deliberately does
 * NOT require the origin to equal CANONICAL_PRODUCTION_URL: a mirror
 * (docs/mirroring.md) on its own domain is legitimate and must not warn.
 *   - `onrender.com` — that host is the API origin (Render), not the web app;
 *     the canonical must never point at it. This is the specific misconfiguration
 *     guarded here.
 *   - `localhost` / `127.0.0.1` — the development fallback leaked into prod.
 *   - an `http://` scheme — a production canonical must be served over https.
 */
function warnIfNonCanonicalProductionUrl(url: string): void {
  if (process.env.VERCEL_ENV !== "production") return;

  const problems: string[] = [];
  if (/onrender\.com/i.test(url)) {
    problems.push("points at an onrender.com host, which is the API origin (Render), not the web app");
  }
  if (/\blocalhost\b|127\.0\.0\.1/i.test(url)) {
    problems.push("points at localhost — the development fallback leaked into a production build");
  }
  if (/^http:\/\//i.test(url)) {
    problems.push("uses an insecure http:// scheme — a production canonical must be https://");
  }

  if (problems.length === 0) return;

  console.warn(
    `[site-url] WARNING: canonical origin resolved to "${url}" for a production build. It ` +
      problems.join("; and ") +
      `. This value backs metadataBase, canonical links, sitemap.xml and robots.txt, so a wrong ` +
      `origin de-indexes the site. Set NEXT_PUBLIC_SITE_URL to the canonical origin (the primary ` +
      `instance uses ${CANONICAL_PRODUCTION_URL}; a mirror uses its own domain) and redeploy.`,
  );
}

warnIfNonCanonicalProductionUrl(SITE_URL);
