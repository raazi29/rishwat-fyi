/**
 * The single HTTP boundary between apps/web and apps/api.
 *
 * Two rules the rest of the app depends on:
 *
 * 1. No route ever throws because the API is down. Every call returns a
 *    discriminated result, and resource modules decide whether to fall back to
 *    the bundled sample dataset. The single, deliberate exception is the
 *    sample-fallback kill switch below: an operator who sets
 *    `NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false` has asked for outages to look
 *    like outages, so an unreachable API throws instead of inventing figures.
 * 2. Fallback data is always tagged `source: "sample"` so the UI can say so.
 *    Sample figures are never presented as live data — see PRODUCT.md.
 */

import type { ApiErrorBody, ApiErrorCode } from "./types";

// 28s, not 12s: the API runs against a managed Postgres (Supabase) whose
// connection pooler can cold-start on the first request after an idle stretch,
// taking 15-25s to answer. A 12s budget fired mid-cold-start and dropped the
// whole page to the "Sample data" banner — the worst possible look for a
// transparency platform. 28s stays under Vercel's 30s serverless ceiling while
// giving a cold pooler room to wake. Cached ISR responses (revalidate) mean
// only the FIRST request after idle pays this; every subsequent visitor is
// served the warm, cached page.
const DEFAULT_TIMEOUT_MS = 28000;

export type DataSource = "api" | "sample";

export interface Sourced<T> {
  data: T;
  source: DataSource;
  /** Present when the API failed and sample data was substituted. */
  reason?: ApiFailure;
}

export interface ApiFailure {
  code: ApiErrorCode | "network_error" | "timeout" | "invalid_response";
  message: string;
  status?: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

/** Where a local `npm run dev` expects apps/api to be listening. */
const DEV_API_BASE_URL = "http://localhost:8787";

/**
 * The origin server-side fetches go to. `API_BASE_URL` wins so a deployment can
 * route internal traffic over a private network; `NEXT_PUBLIC_API_BASE_URL` is
 * the public fallback.
 *
 * Falling back to localhost is a DEVELOPMENT convenience only. In production it
 * would be a silent misconfiguration: every fetch fails, and the site serves the
 * bundled fixtures under a sample-data notice instead of real figures. The
 * production build is guarded in next.config.ts so a deploy with neither value
 * set fails loudly rather than shipping that.
 */
export function apiBaseUrl(): string {
  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  return (base === undefined || base === "" ? DEV_API_BASE_URL : base).replace(/\/+$/, "");
}

/**
 * The origin to put in URLs a BROWSER will follow — dataset download links, the
 * documented base URL on /data/api, the curl snippets on /mirroring.
 *
 * Deliberately prefers the public variable over `API_BASE_URL`: the latter may
 * be an internal hostname that only the server can resolve, and printing that to
 * a reader gives them a link that cannot work.
 */
export function publicApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
  return (base === undefined || base === "" ? DEV_API_BASE_URL : base).replace(/\/+$/, "");
}

/**
 * Whether a read may fall back to the bundled, visibly labelled dataset.
 *
 * Production always allows this safety net. The previous production setting
 * (`NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false`) turned every transient Render
 * timeout into a Server Component exception, taking whole pages down behind the
 * global "Something went wrong" boundary. Returning `source: "sample"` is both
 * safer and honest because every affected page already renders SampleDataStrip.
 *
 * Non-production environments may still set the variable to `false` when they
 * deliberately need to exercise error boundaries.
 */
export function sampleFallbackAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK !== "false";
}

/**
 * Thrown when the API is unavailable and `NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK`
 * forbids substituting the bundled sample dataset.
 *
 * This is what makes the kill switch real: rather than serving invented fees
 * and delays under a disclosure banner, the request fails and the route's
 * error boundary (`app/error.tsx`, or `app/global-error.tsx`) renders. Server
 * components therefore keep their guarantee that `Sourced.data` is present —
 * they either get data or never render at all.
 *
 * Callers that must not surface a raw failure (a server action answering a
 * form, say) should catch this and map it to their own error state.
 */
export class SampleFallbackDisabledError extends Error {
  /** The underlying API failure, for logging and for operator-facing detail. */
  readonly failure: ApiFailure;

  constructor(failure: ApiFailure) {
    super(
      `The API is unavailable (${failure.code}: ${failure.message}) and sample-data fallback is disabled by NEXT_PUBLIC_ALLOW_SAMPLE_FALLBACK=false.`,
    );
    this.name = "SampleFallbackDisabledError";
    this.failure = failure;
  }
}

export interface ApiRequestOptions {
  /** Query parameters; `undefined` and `""` entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  method?: "GET" | "POST";
  body?: unknown;
  /** Bearer token for /admin routes. */
  token?: string;
  /** Seconds. `0` disables the cache (use for anything reporter-specific). */
  revalidate?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const url = new URL(`${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const {
    query,
    method = "GET",
    body,
    token,
    revalidate,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers = {},
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(revalidate === undefined
        ? { cache: "no-store" as const }
        : revalidate === 0
          ? { cache: "no-store" as const }
          : { next: { revalidate } }),
    });

    const text = await response.text();
    const parsed: unknown = text.length > 0 ? safeJsonParse(text) : null;

    if (!response.ok) {
      if (isApiErrorBody(parsed)) {
        return {
          ok: false,
          error: {
            code: parsed.error.code,
            message: parsed.error.message,
            status: response.status,
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "invalid_response",
          message: `Unexpected ${response.status} response from the API.`,
          status: response.status,
        },
      };
    }

    if (parsed === undefined) {
      return {
        ok: false,
        error: { code: "invalid_response", message: "The API returned malformed JSON." },
      };
    }

    return { ok: true, data: parsed as T };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      error: {
        code: aborted ? "timeout" : "network_error",
        message: aborted
          ? `The API did not respond within ${timeoutMs}ms.`
          : "The API could not be reached.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Fetch a list endpoint and unwrap its envelope.
 *
 * The API does not answer list endpoints with a bare JSON array. It returns an
 * object: `{ items }` for the location catalogue, `{ total, rows }` for the
 * dataset export, `{ total, groups }` and `{ total, clusters }` for admin stats.
 *
 * This matters more than it looks. `apiFetch<T>` casts the parsed body to `T`
 * without checking it, so typing one of those responses as `T[]` compiles
 * perfectly and then fails at RUNTIME — `.find` or `.map` of undefined, thrown
 * from inside a server component. That is not a degraded page: it escapes the
 * `withSample` fallback entirely and renders the route's error boundary, so a
 * shape mismatch on one endpoint takes out the whole page.
 *
 * Hence an explicit, validated unwrap. A bare array is accepted too, so this
 * keeps working if an endpoint is ever changed to return one. Anything else
 * becomes an `invalid_response` failure — an ordinary `ApiResult` the caller's
 * `withSample` already knows how to handle.
 */
export async function apiFetchList<T>(
  path: string,
  key: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T[]>> {
  const result = await apiFetch<unknown>(path, options);
  if (!result.ok) return result;

  const body = result.data;
  if (Array.isArray(body)) return { ok: true, data: body as T[] };

  if (typeof body === "object" && body !== null) {
    const list = (body as Record<string, unknown>)[key];
    if (Array.isArray(list)) return { ok: true, data: list as T[] };
  }

  return {
    ok: false,
    error: {
      code: "invalid_response",
      message: `${path} did not return a list under "${key}".`,
    },
  };
}

/**
 * Resolve a call, substituting sample data when the API is unavailable.
 *
 * A `not_found` is not an outage — a live API answered, it simply does not
 * carry the row this deployment's catalogue describes — so the bundled sample
 * still stands in for it, exactly as before, regardless of the kill switch.
 * Every other failure means the API could not answer, and is gated by
 * `sampleFallbackAllowed()`: with the switch off, `SampleFallbackDisabledError`
 * is thrown so the outage reaches the error boundary instead of the reader.
 */
export async function withSample<T>(
  call: () => Promise<ApiResult<T>>,
  sample: () => T,
): Promise<Sourced<T>> {
  const result = await call();
  if (result.ok) return { data: result.data, source: "api" };
  if (result.error.code !== "not_found" && !sampleFallbackAllowed()) {
    throw new SampleFallbackDisabledError(result.error);
  }
  return { data: sample(), source: "sample", reason: result.error };
}

/**
 * Same as `withSample`, but a real 404 stays a 404 (`null`) instead of being
 * papered over with a fixture. The kill switch applies identically: an outage
 * throws rather than returning an invented record, because `null` here would
 * tell the reader the record does not exist, which is a different — and false
 * — statement.
 */
export async function withSampleUnlessMissing<T>(
  call: () => Promise<ApiResult<T>>,
  sample: () => T | null,
): Promise<Sourced<T> | null> {
  const result = await call();
  if (result.ok) return { data: result.data, source: "api" };
  if (result.error.code === "not_found") return null;
  if (!sampleFallbackAllowed()) throw new SampleFallbackDisabledError(result.error);
  const fallback = sample();
  if (fallback === null) return null;
  return { data: fallback, source: "sample", reason: result.error };
}
