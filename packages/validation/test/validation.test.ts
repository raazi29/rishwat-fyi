import { describe, it, expect } from "vitest";
import {
  loginSchema,
  moderationDecisionSchema,
  reportSubmissionSchema,
  serviceQuerySchema,
  slugSchema,
} from "../src/index.js";

const uuid = (n: number) =>
  `123e4567-e89b-12d3-a456-426614174${String(n).padStart(3, "0")}`;

const baseReport = {
  service_id: uuid(0),
  state_id: uuid(1),
  district_id: uuid(2),
  period_start: "2026-01-01",
  period_end: "2026-06-30",
  description:
    "I visited the office three times over six months and was asked for money each time beyond the official fee, with no receipts issued.",
};

describe("reportSubmissionSchema", () => {
  it("accepts a report with only a description", () => {
    const res = reportSubmissionSchema.safeParse(baseReport);
    expect(res.success).toBe(true);
  });

  // The service may be identified by service_id OR service_slug, exactly one.
  const baseNoService = {
    state_id: baseReport.state_id,
    district_id: baseReport.district_id,
    period_start: baseReport.period_start,
    period_end: baseReport.period_end,
    description: baseReport.description,
  };

  it("accepts a report identified by service_slug instead of service_id", () => {
    const res = reportSubmissionSchema.safeParse({
      ...baseNoService,
      service_slug: "driving-licence",
    });
    expect(res.success).toBe(true);
  });

  it("rejects a report that provides neither service_id nor service_slug", () => {
    const res = reportSubmissionSchema.safeParse(baseNoService);
    expect(res.success).toBe(false);
  });

  it("rejects a report that provides both service_id and service_slug", () => {
    const res = reportSubmissionSchema.safeParse({
      ...baseReport,
      service_slug: "driving-licence",
    });
    expect(res.success).toBe(false);
  });

  it("accepts a complete valid report", () => {
    const res = reportSubmissionSchema.safeParse({
      ...baseReport,
      period_end: "2026-01-01",
      official_fee_reported_inr: 100,
      additional_amount_reported_inr: 50,
      amount_paid_inr: 150,
      paid: true,
      delay_days: 10,
      visits: 2,
    });
    expect(res.success).toBe(true);
  });

  it("rejects a report whose period_end is before period_start", () => {
    const res = reportSubmissionSchema.safeParse({
      ...baseReport,
      period_end: "2025-12-31",
    });
    expect(res.success).toBe(false);
  });

  it("rejects a report whose description is shorter than 30 characters", () => {
    const res = reportSubmissionSchema.safeParse({
      ...baseReport,
      description: "Too short",
    });
    expect(res.success).toBe(false);
  });

  it("rejects a report with a negative additional amount", () => {
    const res = reportSubmissionSchema.safeParse({
      ...baseReport,
      additional_amount_reported_inr: -5,
    });
    expect(res.success).toBe(false);
  });
});

describe("moderationDecisionSchema", () => {
  it("rejects acknowledging officially without a source_url", () => {
    const res = moderationDecisionSchema.safeParse({
      public_id: "R-abcd1234",
      action: "acknowledge_officially",
    });
    expect(res.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    const res = loginSchema.safeParse({
      email: "moderator@rishwat.fyi",
      password: "correct-horse-battery-staple",
    });
    expect(res.success).toBe(true);
  });

  it("rejects a login with a short password", () => {
    const res = loginSchema.safeParse({
      email: "moderator@rishwat.fyi",
      password: "short",
    });
    expect(res.success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("rejects a slug with invalid characters", () => {
    const res = slugSchema.safeParse("Bad Slug!");
    expect(res.success).toBe(false);
  });
});

describe("serviceQuerySchema", () => {
  it("rejects a per_page above the maximum", () => {
    const res = serviceQuerySchema.safeParse({ per_page: 1000 });
    expect(res.success).toBe(false);
  });
});
