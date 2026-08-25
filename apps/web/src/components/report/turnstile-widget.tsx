"use client";

/**
 * Cloudflare Turnstile widget — manual script integration, no npm dependency.
 *
 * Loads Cloudflare's `api.js` once per document and renders the challenge
 * explicitly so the solved token arrives via a callback (rather than being
 * posted with a native form). Turnstile is a free, privacy-friendly CAPTCHA;
 * here it protects the anonymous report submission from automated abuse.
 *
 * Graceful degradation: when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset — local
 * dev, tests, or a deployment that has not configured Turnstile — this renders
 * nothing and fires no callbacks. The wizard then submits without a token and
 * the API, which likewise skips verification when its secret is unset, accepts
 * it. Turnstile is enabled purely by configuring the two keys.
 */

import { useEffect, useRef } from "react";

/**
 * Public site key. `NEXT_PUBLIC_*` is inlined at build time, so this is a
 * constant for the lifetime of the bundle — enabling Turnstile requires a
 * redeploy, not just a dashboard change (consistent with the other
 * NEXT_PUBLIC_* switches documented in .env.example).
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const READY_TIMEOUT_MS = 5000;

/**
 * Whether Turnstile is configured for this build. A single source of truth the
 * wizard uses to gate submission and the review step uses to show the widget,
 * so the two can never disagree about whether a token is required.
 */
export const TURNSTILE_ENABLED = Boolean(SITE_KEY);

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  action?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  "timeout-callback"?: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, opts: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** One shared script load for the whole document. */
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    // The script's `load` event can fire a tick before `window.turnstile` is
    // assigned, so resolve only once the API object is actually present.
    const whenReady = () => {
      if (window.turnstile) return resolve();
      const start = Date.now();
      const poll = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(poll);
          resolve();
        } else if (Date.now() - start > READY_TIMEOUT_MS) {
          window.clearInterval(poll);
          reject(new Error("Turnstile loaded but the API never became available"));
        }
      }, 50);
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.turnstile) return resolve();
      existing.addEventListener("load", whenReady);
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", whenReady);
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export interface TurnstileWidgetProps {
  /** Receives the solved token, or `null` when it expires, errors, or resets. */
  onVerify: (token: string | null) => void;
  /**
   * Called when Turnstile's script fails to load or never initialises (blocked
   * by an ad-blocker, corporate proxy, or region). Lets the parent offer a
   * fallback instead of leaving the user stuck at a check that never renders.
   */
  onBlocked?: () => void;
  /**
   * Bump this (e.g. increment a counter) to discard the current token and issue
   * a fresh challenge — needed after a failed submit, since a Turnstile token is
   * single-use and a reused one always fails verification.
   */
  resetKey?: number;
  /** Optional Turnstile action label, surfaced in Cloudflare analytics. */
  action?: string;
  className?: string;
}

export function TurnstileWidget({ onVerify, onBlocked, resetKey, action, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Hold the latest callback in a ref so changing it never re-runs the render
  // effect (which would tear down and re-mount the widget on every parent render).
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  // Same pattern for onBlocked: hold it in a ref so changing it never re-runs
  // the render effect (which would tear down and re-mount the widget).
  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        // Guard against a double render (React StrictMode invokes effects twice
        // in development): only ever mount one widget per container.
        if (widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "auto",
          action,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onVerifyRef.current(null),
          "error-callback": () => onVerifyRef.current(null),
          "timeout-callback": () => onVerifyRef.current(null),
        });
      })
      .catch(() => {
        // Script blocked or never initialised (ad-blocker, corporate proxy,
        // region). We deliberately do NOT hand back a token — failing closed is
        // correct — but we DO notify the parent so it can offer a fallback path
        // instead of leaving the user stuck at a check that never renders.
        if (onBlockedRef.current) onBlockedRef.current();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // `action` is effectively static; re-rendering on a change is fine and rare.
  }, [action]);

  // Reset to a fresh, unsolved challenge whenever the parent bumps `resetKey`.
  // Skips the initial mount (nothing to reset yet).
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onVerifyRef.current(null);
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className={className} />;
}
