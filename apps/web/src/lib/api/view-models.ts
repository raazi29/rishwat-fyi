/**
 * Frontend-only view models.
 *
 * `src/lib/api/types.ts` is the wire contract and is off-limits to edit. These
 * types are assembled entirely on the frontend (or by the bundled sample
 * dataset) from wire types — they never appear on the API. They live here so
 * both the resource modules and the fixtures can share them.
 *
 * If the API later grows an endpoint that returns one of these shapes, promote
 * the definition into `types.ts` and delete it here.
 */

import type {
  DistrictRef,
  Inr,
  StateGap,
  StateRef,
  VerificationLevel,
} from "./types";

/** Shared query for `searchServices` / `listServices` / `getComparisonRows`. */
export interface ServiceSearchParams {
  q?: string;
  department?: string;
  state?: string;
  district?: string;
  page?: number;
  per_page?: number;
}

/**
 * A state page's assembled view: the state, its reported gap, its districts,
 * and the services with the most reports in that state. There is no single API
 * endpoint for this — the frontend composes it from `/states/:code/districts`
 * plus aggregates, and it falls back to sample data wholesale.
 */
export interface StateDetailView {
  state: StateRef;
  gap: StateGap;
  districts: DistrictRef[];
  top_services: StateServiceGap[];
}

export interface StateServiceGap {
  slug: string;
  name: string;
  department: string;
  report_count: number;
  additional_amount_median: Inr | null;
  verification: VerificationLevel | null;
}

/** One bar of a dual-series (official vs reported) distribution chart. */
export interface DistributionBucket {
  label: string;
  /** Share of official-procedure expectation in this bucket, 0–1. */
  official: number;
  /** Share of citizen reports in this bucket, 0–1. */
  reported: number;
}

/**
 * The distributions shown on a service page: reported timeline and reported
 * additional-amount, each as a bucketed dual series. Illustrative sample data.
 */
export interface ServiceDistributions {
  slug: string;
  timeline_days: DistributionBucket[];
  additional_amount_inr: DistributionBucket[];
}

/** A derived friction signal (one of methodology's canonical issue keywords). */
export interface FrictionPoint {
  code: string;
  /** Fraction of reports in the cell mentioning this issue, 0–1. */
  share: number;
}
