/**
 * Public entry point for the API layer.
 *
 * Re-exports the wire types, the frontend-only view models, the HTTP client
 * helpers, and every resource function. Import from `@/lib/api` rather than the
 * individual modules.
 */

// Wire contract + frontend view models.
export * from "./types";
export * from "./view-models";

// HTTP boundary: apiFetch, withSample, withSampleUnlessMissing, Sourced,
// ApiResult, apiBaseUrl, buildUrl, sampleFallbackAllowed, and related types.
export * from "./client";

// Resource modules.
export * from "./health";
export * from "./geo";
export * from "./services";
export * from "./reports";
export * from "./datasets";
export * from "./admin";
