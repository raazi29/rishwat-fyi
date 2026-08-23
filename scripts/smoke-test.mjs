#!/usr/bin/env node
/**
 * Post-deployment smoke test.
 *
 *   node scripts/smoke-test.mjs https://api.rishwat.fyi [https://rishwat.fyi]
 *
 * Checks a LIVE deployment for the misconfigurations that fail silently — the
 * ones where the site looks fine and is quietly wrong: sample data served as
 * real, localhost URLs published to mirrors, evidence written to a disk that
 * evaporates on redeploy, prepared statements colliding on the pooler.
 *
 * Read-only. It submits no reports and creates no data. The one write-shaped
 * probe (oversize evidence upload) is deliberately never completed: it declares
 * a large Content-Length, sends a few bytes, and asserts the server rejects it
 * before reading the body. That IS the test — a server that waits for the full
 * body is the one that can be OOM-killed by an unauthenticated caller.
 *
 * Exit code 0 = all checks passed, 1 = at least one failed.
 */

import http from "node:http";
import https from "node:https";

const [, , apiArg, siteArg] = process.argv;

if (!apiArg) {
  console.error("usage: node scripts/smoke-test.mjs <api-url> [site-url]");
  process.exit(2);
}

const API = apiArg.replace(/\/+$/, "");
const SITE = siteArg?.replace(/\/+$/, "");

const results = [];
const record = (level, name, detail) => {
  results.push({ level, name, detail });
  const mark = level === "pass" ? "  ok  " : level === "warn" ? " warn " : " FAIL ";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
};
const pass = (n, d) => record("pass", n, d);
const warn = (n, d) => record("warn", n, d);
const fail = (n, d) => record("fail", n, d);

/** Anything that looks like a development address leaking into published output. */
const LOCALHOST = /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i;

async function getJson(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  return { res, body, text };
}

// ---------------------------------------------------------------------------
// 1. /health — database reachable, and which storage driver is actually live.
// ---------------------------------------------------------------------------
async function checkHealth() {
  let r;
  try {
    r = await getJson("/health");
  } catch (e) {
    fail("health reachable", e.message);
    return;
  }

  if (r.res.status !== 200) {
    fail("health returns 200", `got ${r.res.status} — body: ${r.text.slice(0, 200)}`);
  } else {
    pass("health returns 200");
  }

  if (r.body?.database === "up") {
    // Reaching the database at all proves TLS negotiated: postgres.js now sends
    // ssl:"require" for any non-local host, so a provider refusing TLS — or
    // accepting only plaintext — would show up here as "down".
    pass("database up (TLS negotiated with the managed instance)");
  } else {
    fail("database up", `database="${r.body?.database}" — check DATABASE_URL and TLS`);
  }

  const driver = r.body?.storage?.driver;
  if (driver === "supabase") {
    pass("evidence storage driver", "supabase");
  } else if (driver === "local") {
    fail(
      "evidence storage driver",
      'driver="local" in production — uploads are written to an ephemeral container ' +
        "filesystem and will be destroyed on the next redeploy while the database rows survive",
    );
  } else {
    warn("evidence storage driver", `unexpected driver: ${JSON.stringify(driver)}`);
  }
}

// ---------------------------------------------------------------------------
// 2. PUBLIC_BASE_URL — these URLs are PUBLISHED to every downstream mirror.
// ---------------------------------------------------------------------------
async function checkPublishedUrls() {
  try {
    const { body } = await getJson("/datasets");
    const urls = (body?.datasets ?? []).flatMap((d) => Object.values(d.formats ?? {}));
    if (urls.length === 0) {
      warn("dataset download URLs", "no datasets listed");
    } else if (urls.some((u) => LOCALHOST.test(u))) {
      fail(
        "dataset download URLs",
        `PUBLIC_BASE_URL is wrong — mirrors would receive ${urls[0]}`,
      );
    } else {
      pass("dataset download URLs", urls[0]);
    }
  } catch (e) {
    fail("dataset index reachable", e.message);
  }

  try {
    const { body } = await getJson("/doc/openapi.json");
    const servers = (body?.servers ?? []).map((s) => s.url).filter(Boolean);
    if (servers.some((u) => LOCALHOST.test(u))) {
      fail("openapi servers[]", `advertises ${servers.find((u) => LOCALHOST.test(u))}`);
    } else if (servers.length > 0) {
      pass("openapi servers[]", servers[0]);
    } else {
      warn("openapi servers[]", "no servers advertised");
    }
  } catch (e) {
    warn("openapi document", e.message);
  }
}

// ---------------------------------------------------------------------------
// 3. Schema + seed data. /health's `select 1` succeeds against an EMPTY database,
//    so a deploy that never had migrate/seed run looks healthy while every real
//    endpoint 500s. These two catch that.
// ---------------------------------------------------------------------------
async function checkDataPresent() {
  try {
    const { res, body } = await getJson("/services?per_page=1");
    if (res.status !== 200) fail("services endpoint", `HTTP ${res.status}`);
    else if ((body?.total ?? 0) > 0) pass("service catalogue seeded", `${body.total} services`);
    else fail("service catalogue seeded", "0 services — did `npm run db:seed` run?");
  } catch (e) {
    fail("services endpoint", e.message);
  }

  try {
    const { res, body } = await getJson("/locations/states");
    if (res.status !== 200) fail("locations endpoint", `HTTP ${res.status}`);
    else if (Array.isArray(body) && body.length > 0) {
      pass("reference geography seeded", `${body.length} states`);
    } else {
      fail("reference geography seeded", "0 states — did `npm run db:seed` run?");
    }
  } catch (e) {
    fail("locations endpoint", e.message);
  }
}

// ---------------------------------------------------------------------------
// 4. Pooler behaviour. Supavisor in transaction mode rebinds a client to a
//    different backend between statements, so server-side named prepared
//    statements can collide or vanish. That failure is LOAD-DEPENDENT — a single
//    request will not show it. Fan out concurrently and look for 500s.
// ---------------------------------------------------------------------------
async function checkPooler() {
  const N = 24;
  try {
    const settled = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        getJson(`/search?q=${["licence", "passport", "certificate", "registration"][i % 4]}`)
          .then((r) => r.res.status)
          .catch(() => 0),
      ),
    );
    const bad = settled.filter((s) => s !== 200 && s !== 429);
    const limited = settled.filter((s) => s === 429).length;

    if (bad.length > 0) {
      fail(
        "concurrent queries over the pooler",
        `${bad.length}/${N} failed (${[...new Set(bad)].join(", ")}) — check the API logs for ` +
          '"prepared statement ... already exists"; port 6543 needs prepare:false',
      );
    } else if (limited > 0) {
      pass("concurrent queries over the pooler", `${N - limited} ok, ${limited} rate-limited`);
    } else {
      pass("concurrent queries over the pooler", `${N}/${N} ok`);
    }
  } catch (e) {
    fail("concurrent queries over the pooler", e.message);
  }
}

// ---------------------------------------------------------------------------
// 5. CORS scoping. The public API is meant to be wide open; /admin must NOT be —
//    its responses carry ip_hash prefixes and moderation data.
// ---------------------------------------------------------------------------
async function checkCors() {
  const origin = "https://smoke-test.invalid";
  try {
    const pub = await fetch(`${API}/health`, {
      headers: { origin },
      signal: AbortSignal.timeout(15_000),
    });
    const adm = await fetch(`${API}/admin/stats/clusters`, {
      headers: { origin },
      signal: AbortSignal.timeout(15_000),
    });

    if (pub.headers.get("access-control-allow-origin") === "*") {
      pass("public CORS is open", "/health sends Allow-Origin: *");
    } else {
      warn("public CORS is open", "/health did not send a wildcard");
    }

    const admAllow = adm.headers.get("access-control-allow-origin");
    if (admAllow === "*" || admAllow === origin) {
      fail("/admin CORS is restricted", `echoed Allow-Origin: ${admAllow} to an arbitrary origin`);
    } else {
      pass("/admin CORS is restricted", "no CORS headers for an unlisted origin");
    }

    if (adm.status === 401 || adm.status === 403) {
      pass("/admin requires auth", `HTTP ${adm.status}`);
    } else {
      fail("/admin requires auth", `unauthenticated request returned HTTP ${adm.status}`);
    }
  } catch (e) {
    warn("CORS checks", e.message);
  }
}

// ---------------------------------------------------------------------------
// 6. Oversize upload guard. Declares a large Content-Length, sends a handful of
//    bytes, never finishes the body. A correct server answers 413 immediately.
//    A server that instead waits is the one an unauthenticated caller can
//    OOM-kill — so a timeout here is a FAIL, not an inconclusive result.
// ---------------------------------------------------------------------------
function checkUploadGuard() {
  const url = new URL("/evidence", API);
  const mod = url.protocol === "https:" ? https : http;
  const DECLARED = 25 * 1024 * 1024;

  return new Promise((resolve) => {
    let done = false;
    const finish = (fn, detail) => {
      if (done) return;
      done = true;
      fn("oversize upload rejected before the body is read", detail);
      resolve();
    };

    const req = mod.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=----smoketest",
          "content-length": String(DECLARED),
        },
        timeout: 20_000,
      },
      (res) => {
        if (res.statusCode === 413) finish(pass, "HTTP 413 without reading the body");
        else if (res.statusCode === 429) finish(warn, "rate-limited (429) — retry in an hour");
        else finish(fail, `expected 413, got HTTP ${res.statusCode}`);
        res.destroy();
        req.destroy();
      },
    );

    req.on("error", (e) => {
      // A reset after the server has already answered is normal; a reset with no
      // response at all is not conclusive either way, so report it as a warning.
      finish(warn, `connection error before a response: ${e.message}`);
    });

    req.on("timeout", () => {
      finish(
        fail,
        "server waited for the full 25 MiB instead of rejecting up front — an " +
          "unauthenticated caller can exhaust memory",
      );
      req.destroy();
    });

    // A token amount, nowhere near the declared length.
    req.write("------smoketest\r\n");
  });
}

// ---------------------------------------------------------------------------
// 7. The web app: is it serving real data, and is its published origin right?
// ---------------------------------------------------------------------------
async function checkSite() {
  if (!SITE) {
    console.log("\n(no site URL given — skipping frontend checks)");
    return;
  }

  try {
    const res = await fetch(SITE, { signal: AbortSignal.timeout(30_000) });
    const html = await res.text();

    if (/These figures are sample data/i.test(html)) {
      fail(
        "site serves live data",
        "the home page is rendering the BUNDLED SAMPLE DATASET — the API is unreachable " +
          "from the frontend. Check API_BASE_URL, and set NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false",
      );
    } else {
      pass("site serves live data", "no sample-data strip on the home page");
    }

    for (const [header, expected] of [
      ["x-content-type-options", "nosniff"],
      ["x-frame-options", "DENY"],
    ]) {
      const got = res.headers.get(header);
      if (got?.toLowerCase() === expected.toLowerCase()) pass(`header ${header}`, got);
      else warn(`header ${header}`, `expected ${expected}, got ${got ?? "(absent)"}`);
    }
  } catch (e) {
    fail("site reachable", e.message);
  }

  // A sitemap or robots.txt full of localhost URLs gets the site de-indexed.
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    try {
      const res = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(30_000) });
      const text = await res.text();
      if (LOCALHOST.test(text)) {
        fail(`${path} has no localhost URLs`, "NEXT_PUBLIC_SITE_URL was not set at BUILD time");
      } else {
        pass(`${path} has no localhost URLs`);
      }
    } catch (e) {
      warn(`${path} reachable`, e.message);
    }
  }
}

// ---------------------------------------------------------------------------

console.log(`API:  ${API}`);
console.log(`Site: ${SITE ?? "(not checked)"}\n`);

await checkHealth();
await checkPublishedUrls();
await checkDataPresent();
await checkPooler();
await checkCors();
await checkUploadGuard();
await checkSite();

const failed = results.filter((r) => r.level === "fail");
const warned = results.filter((r) => r.level === "warn");

console.log(
  `\n${results.length - failed.length - warned.length} passed, ` +
    `${warned.length} warning(s), ${failed.length} failed`,
);

if (failed.length > 0) {
  console.log("\nFailed checks:");
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
}

console.log(
  "\nNot verifiable from outside — check these in the Railway dashboard:\n" +
    "  - TRUSTED_PROXY_HOPS must be 1. At 0 behind Railway's proxy every client\n" +
    "    shares one rate-limit bucket and one ip_hash, so no aggregate ever publishes.\n" +
    "  - Replica count must stay at 1. Rate-limit buckets are per-process memory.\n" +
    "  - The boot log should NOT contain a [config] TRUSTED_PROXY_HOPS warning.",
);

process.exit(failed.length > 0 ? 1 : 0);
