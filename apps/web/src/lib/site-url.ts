/**
 * The canonical origin of this deployment.
 *
 * Used for `metadataBase` (which every canonical link and Open Graph image URL
 * is resolved against), `robots.txt` and `sitemap.xml`. Getting it wrong is not
 * a visible error — it just publishes several hundred `http://localhost:3000`
 * URLs to search engines and quietly de-indexes the site — so the resolution
 * order below fills it in from the platform before it ever falls back.
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — set this explicitly for a custom domain.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — injected by Vercel, the project's stable
 *    production domain (not the per-deployment URL). A correct absolute origin
 *    beats a localhost placeholder even when step 1 was forgotten.
 * 3. `http://localhost:3000` — local development only.
 *
 * Note this is resolved at BUILD time: `NEXT_PUBLIC_*` values are inlined by the
 * compiler, and robots/sitemap are prerendered. Changing it in a hosting
 * dashboard requires a redeploy to take effect.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit !== undefined && explicit !== "") return explicit;

  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelDomain !== undefined && vercelDomain !== "") return `https://${vercelDomain}`;

  return "http://localhost:3000";
}

/** Absolute origin, no trailing slash. */
export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");
