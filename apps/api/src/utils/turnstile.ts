/**
 * Cloudflare Turnstile server-side verification.
 *
 * Turnstile issues a short-lived, single-use token to the browser widget once a
 * visitor clears the challenge. The server exchanges that token with
 * Cloudflare's `siteverify` endpoint to confirm the challenge was actually
 * solved — the one signal a script that skips the widget cannot forge. A report
 * submission is rejected when this fails.
 *
 * The caller decides *whether* to verify: this is only reached when a secret is
 * configured. When no secret is set (local dev, the test-suite), the API skips
 * the check entirely and this module is never invoked.
 *
 * Fail-closed: any transport failure, timeout, malformed response, or non-2xx
 * status returns `{ success: false }` so a submission is never waved through
 * because Cloudflare happened to be unreachable.
 */

/** Cloudflare's token-verification endpoint. */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cap the outbound call so a stalled siteverify cannot hang a submission. */
const VERIFY_TIMEOUT_MS = 5000;

export interface TurnstileResult {
  success: boolean;
  /**
   * Cloudflare error codes (e.g. "invalid-input-response", "timeout-or-duplicate")
   * or a synthetic transport code. For server-side logging/diagnostics only —
   * never surfaced to the client, which sees a generic message.
   */
  errorCodes: string[];
}

/** The subset of the siteverify response body we rely on. */
interface SiteVerifyResponse {
  success?: boolean;
  "error-codes"?: string[];
}

/**
 * Verify a Turnstile token with Cloudflare.
 *
 * @param secret   Server-side secret key (`TURNSTILE_SECRET_KEY`).
 * @param token    The token produced by the browser widget.
 * @param remoteIp Optional client IP; Cloudflare uses it as an extra signal.
 */
export async function verifyTurnstile(
  secret: string,
  token: string,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    // siteverify accepts application/x-www-form-urlencoded — the format
    // Cloudflare documents — so the token/secret are form fields, not JSON.
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp) form.set("remoteip", remoteIp);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) return { success: false, errorCodes: [`http-${res.status}`] };

    const data = (await res.json().catch(() => null)) as SiteVerifyResponse | null;
    if (!data || typeof data.success !== "boolean") {
      return { success: false, errorCodes: ["invalid-response"] };
    }
    return { success: data.success, errorCodes: data["error-codes"] ?? [] };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return { success: false, errorCodes: [aborted ? "timeout" : "network-error"] };
  } finally {
    clearTimeout(timer);
  }
}
