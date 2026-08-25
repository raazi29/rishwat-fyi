import { NextResponse } from "next/server";

/**
 * Keep-warm cron target.
 *
 * The API (Render) and its managed Postgres (Supabase pooler) both cold-start
 * after an idle stretch: the first request in ~15 minutes can take 15-25s while
 * the dyno wakes and the pooler opens connections. During that window a real
 * visitor's page would drop to the "Sample data" banner — a fake-looking site
 * for a transparency platform.
 *
 * This route is hit by a Vercel Cron every 10 minutes (see apps/web/vercel.json).
 * It makes one cheap GET to the API's /health endpoint, which runs a trivial
 * `select 1` against Postgres — enough to keep the dyno and the pooler warm so
 * the first human visitor after idle is served a live page, not a fallback.
 *
 * It is deliberately side-effect-free and unauthenticated-safe: it only performs
 * an outbound GET and returns a small JSON status. It never mutates data.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

export async function GET() {
  const target = `${API_BASE_URL.replace(/\/+$/, "")}/health`;
  const startedAt = Date.now();

  try {
    const res = await fetch(target, {
      headers: { accept: "application/json" },
      // Generous budget: the whole point is to absorb a cold start so the next
      // real visitor doesn't. Stays under the Vercel serverless ceiling.
      signal: AbortSignal.timeout(28_000),
      cache: "no-store",
    });
    const elapsedMs = Date.now() - startedAt;
    return NextResponse.json(
      { ok: res.ok, status: res.status, elapsedMs },
      { status: res.ok ? 200 : 502 },
    );
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ ok: false, elapsedMs, error: message }, { status: 502 });
  }
}
