import type { NextConfig } from "next";

// Fail a real production deploy that is missing the API origin, rather than
// shipping a site that quietly serves the bundled sample dataset.
//
// Without this the misconfiguration is invisible: `apiBaseUrl()` falls back to
// http://localhost:8787, every server-side fetch fails, and the sample-fallback
// path renders fixtures under a notice strip — a live-looking site full of
// invented fees. `NEXT_PUBLIC_*` values are inlined at build time, so the check
// has to happen here, at build, not at request time.
//
// Scoped to VERCEL_ENV=production on purpose: CI builds with no API running (by
// design — see .github/workflows/ci.yml) and local `next build` must both keep
// working untouched.
if (
  process.env.VERCEL_ENV === "production" &&
  !process.env.API_BASE_URL &&
  !process.env.NEXT_PUBLIC_API_BASE_URL
) {
  throw new Error(
    "Production build is missing the API origin. Set API_BASE_URL (server-side fetches) " +
      "and/or NEXT_PUBLIC_API_BASE_URL (browser-facing links) in the project's environment " +
      "variables. Without one, the deployed site falls back to http://localhost:8787 and " +
      "serves sample data instead of live reports.",
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // These workspace packages are consumed as TypeScript source, not a built
  // dist. @rishwat/api is the Hono app mounted at /api/[[...route]]; it pulls in
  // @rishwat/database (drizzle schema + createDb) and @rishwat/validation (zod
  // schemas) as source, so all three must be transpiled by Next.
  transpilePackages: ["@rishwat/validation", "@rishwat/database", "@rishwat/api"],
  webpack(config) {
    // `@rishwat/validation` is authored for NodeNext, so its internal imports
    // carry `.js` extensions that point at `.ts` files. Teach the bundler the
    // same mapping the TypeScript compiler uses.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Vercel already sends HSTS for its own domains and for custom
          // domains, so on the current host this is belt-and-braces. It is set
          // here anyway so the guarantee travels with the code rather than with
          // one hosting provider — a mirror served from anywhere else gets the
          // same protection (docs/mirroring.md). `includeSubDomains` also covers
          // api.rishwat.fyi. `preload` is deliberately omitted: submitting the
          // domain to the browser preload list is a hard-to-reverse commitment
          // and belongs to whoever operates the domain, not to this file.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
