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
    // Content-Security-Policy.
    //
    // The list below is the strict production baseline: it blocks injected
    // external scripts, clickjacking via framing, <base> hijacking and
    // cross-origin form posts. `next dev` needs two directives loosened, so the
    // development build (NODE_ENV !== "production") appends exactly those two
    // and nothing else:
    //
    //   - script-src gains 'unsafe-eval' — webpack's dev source maps and React
    //     Fast Refresh evaluate code via eval(). Production ships no eval and
    //     must never allow it.
    //   - connect-src gains the HMR WebSocket (ws:) — `next dev` streams hot
    //     updates over a WebSocket, and 'self' does not reliably match the ws:
    //     scheme across browsers.
    //
    // Directives that are identical in both environments, and why they are what
    // they are:
    //   - script-src keeps 'unsafe-inline': Next injects inline bootstrap and
    //     hydration scripts, and the pre-paint theme bootstrap
    //     (components/layout/theme-script.tsx) is an inline <script>. This is
    //     the weakest part of the policy; tightening it to a per-request nonce
    //     needs middleware and is deliberately left for later.
    //   - style-src 'unsafe-inline' covers React inline style={...} attributes
    //     used across the chart and map components, plus Next's injected styles.
    //   - img-src allows data: (the inline brand mark, next/image blur
    //     placeholders) and blob: (client-generated object URLs).
    //   - connect-src names the API origin for browser-initiated calls. Today
    //     every API call is proxied through the Next server — Server Components
    //     fetch server-side (not subject to CSP) and Server Actions POST to
    //     'self' — so 'self' alone already covers current runtime traffic;
    //     https://api.rishwat.fyi is listed so a future client-side fetch keeps
    //     working without another deploy.
    //   - frame-ancestors 'none' is the modern twin of the X-Frame-Options:
    //     DENY header below; both are sent for older-browser coverage.
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self' https://api.rishwat.fyi${isDev ? " ws:" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
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
