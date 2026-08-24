import Script from "next/script";

/**
 * Plausible analytics loader — privacy-respecting, cookieless and GDPR
 * compliant, so it needs no consent banner and can render unconditionally once
 * enabled.
 *
 * Renders nothing unless NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set. That keeps
 * analytics off in dev/local and on any deploy that leaves it blank, and means
 * dropping this component into the layout is a no-op until a domain is
 * configured. Like every NEXT_PUBLIC_* value the domain and host are inlined by
 * the compiler at BUILD time, so toggling analytics on or off requires a
 * redeploy — changing them in a hosting dashboard alone has no effect.
 *
 * NEXT_PUBLIC_PLAUSIBLE_HOST selects the script origin: Plausible Cloud (the
 * default, https://plausible.io) or a self-hosted instance. A trailing slash is
 * stripped so `${host}/js/script.js` never becomes a double-slashed URL.
 */
export function PlausibleAnalytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (domain === undefined || domain === "") return null;

  const host = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(
    /\/+$/,
    "",
  );

  return <Script strategy="afterInteractive" data-domain={domain} src={`${host}/js/script.js`} />;
}
