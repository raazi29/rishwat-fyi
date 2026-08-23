import { describe, it, expect } from "vitest";
import type { Context } from "hono";
import { clientIp } from "../src/utils/client-ip.js";

// Pure unit test — no app, no database. `clientIp` only ever touches
// `c.req.header(...)` and (via getConnInfo) `c.env`, so a minimal stub is enough.
// `c.env` is deliberately absent, which makes getConnInfo throw exactly as it does
// under `app.request(...)`; that is the "no socket peer" case we want to assert.
function ctx(headers: Record<string, string>): Context {
  const lookup = (name: string): string | undefined => headers[name.toLowerCase()];
  return { req: { header: lookup } } as unknown as Context;
}

const SPOOFED = "1.2.3.4";

describe("clientIp", () => {
  it("ignores a spoofed x-forwarded-for when hops = 0", () => {
    // No trusted proxy: the header is pure client input and must not be read,
    // and with no socket peer available there is no address at all.
    expect(clientIp(ctx({ "x-forwarded-for": SPOOFED }), 0)).toBeNull();
  });

  it("ignores cf-connecting-ip when hops = 0", () => {
    expect(clientIp(ctx({ "cf-connecting-ip": SPOOFED }), 0)).toBeNull();
  });

  it("takes the last entry when hops = 1", () => {
    const c = ctx({ "x-forwarded-for": `${SPOOFED}, 5.6.7.8, 9.10.11.12` });
    expect(clientIp(c, 1)).toBe("9.10.11.12");
  });

  it("takes the second-from-last entry when hops = 2", () => {
    const c = ctx({ "x-forwarded-for": `${SPOOFED}, 5.6.7.8, 9.10.11.12` });
    expect(clientIp(c, 2)).toBe("5.6.7.8");
  });

  it("refuses the leftmost entry when the list is shorter than hops", () => {
    // A chain shorter than the configured hop count means the request did not
    // traverse the proxies we trust, so every remaining entry is client-written.
    // Returning parts[0] here would hand an attacker a free IP of their choosing
    // — rotate the header and you forge ip_hash diversity and skip rate limits.
    // No trustworthy value exists, and with no socket peer the answer is null.
    const c = ctx({ "x-forwarded-for": `${SPOOFED}, 5.6.7.8` });
    expect(clientIp(c, 5)).toBeNull();
  });

  it("does not let a short x-forwarded-for become distinct spoofed identities", () => {
    // Same corroboration bypass as the hops = 0 case below, reached via an
    // under-length chain instead.
    const a = clientIp(ctx({ "x-forwarded-for": "203.0.113.1" }), 2);
    const b = clientIp(ctx({ "x-forwarded-for": "203.0.113.2" }), 2);
    expect(a).toBe(b);
    expect(a).toBeNull();
  });

  it("returns null when no forwarding header is present", () => {
    expect(clientIp(ctx({}), 1)).toBeNull();
  });

  it("trims surrounding whitespace around entries", () => {
    const c = ctx({ "x-forwarded-for": "  1.2.3.4  ,   9.10.11.12   " });
    expect(clientIp(c, 1)).toBe("9.10.11.12");
  });

  it("skips empty entries in a malformed list", () => {
    const c = ctx({ "x-forwarded-for": "1.2.3.4, , 9.10.11.12" });
    expect(clientIp(c, 1)).toBe("9.10.11.12");
  });

  it("ignores cf-connecting-ip even at hops >= 1 when x-forwarded-for is absent", () => {
    // Cloudflare overwrites cf-connecting-ip at its edge — but it also always
    // appends to x-forwarded-for. So a request carrying cf-connecting-ip and NO
    // x-forwarded-for did not come through Cloudflare, and the header was
    // written by the client. Trusting it here only ever trusted a forgery.
    expect(clientIp(ctx({ "cf-connecting-ip": SPOOFED }), 1)).toBeNull();
  });

  it("does not let two forged x-forwarded-for values become two distinct clients at hops = 0", () => {
    // The corroboration bypass: distinct spoofed headers must collapse to the
    // same (null) identity so they cannot manufacture independent ip_hashes.
    const a = clientIp(ctx({ "x-forwarded-for": "203.0.113.1" }), 0);
    const b = clientIp(ctx({ "x-forwarded-for": "203.0.113.2" }), 0);
    expect(a).toBe(b);
    expect(a).toBeNull();
  });
});
