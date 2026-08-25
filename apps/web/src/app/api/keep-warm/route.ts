import { NextResponse } from "next/server";

/**
 * Keep-warm cron target.
 *
 * The API is a Render Web Service (https://rishwat-fyi.onrender.com). On
 * Render's free/starter tiers the service spins DOWN after ~15 minutes of
 * inactivity, and the next request pays a 30-50s cold boot while the container
 * restarts and its managed Postgres (Supabase pooler) reconnects. During that
 * window a real visitor's page drops to the "Sample data" banner — a
 * fake-looking site for a transparency platform.
 *
 * This route is hit by a Vercel Cron every 10 minutes (see apps/web/vercel.json).
 * It makes one cheap GET to the API's /health endpoint (a trivial `select 1`),
 * keeping the Render service awake so the first human visitor after idle is
 * served a live page, not a fallback.
 *
 * It is side-effect-free: it only performs an outbound GET and returns a small
 * JSON status. It never mutates data.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Prefer the explicit server-side API origin; fall back to the browser-facing
// one, then localhost for dev. In production this MUST resolve to the Render
// origin (https://rishwat-fyi.onrender.com) so the cron actually keeps the
// backend warm rather than pinging the Next.js app itself.
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
