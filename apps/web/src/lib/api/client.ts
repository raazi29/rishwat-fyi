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

const DEFAULT_TIMEOUT_MS = 6000;

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

export function apiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8787"
  ).replace(/\/+$/, "");
}

/**
 * The sample-data kill switch. Unset (the local-development default) means the
 * bundled fixtures may stand in for an unreachable API; `"false"` means they
 * may not. Read at call time rather than module load so a value injected after
 * the bundle is evaluated still takes effect.
 */
export function sampleFallbackAllowed(): boolean {
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
