/**
 * Unit tests for the public-dataset aggregation helpers.
 *
 * These functions turn one flat export (`GET /datasets/reports.json`) into the
 * figures the map, the leaderboard and the state pages show. The tests below
 * pin the exact contract: medians are medians of the *reported* additional
 * amount (money stays a fixed 2-decimal string), unknown states are ignored by
 * the per-state views, and every state in the reference list always gets a row.
 *
 * `median` is not exported, so it is exercised through `deriveStateGaps`,
 * `deriveStateDelays` and `deriveStateServices`.
 */

import { describe, it, expect } from "vitest";
import {
  deriveStateGaps,
  deriveStateDelays,
  deriveTotals,
  deriveStateServices,
  type DatasetRow,
} from "./dataset-aggregate";
import type { StateGap, StateRef } from "./types";

const STATES: StateRef[] = [
  { id: "1", code: "MH", name: "Maharashtra" },
  { id: "2", code: "KA", name: "Karnataka" },
  { id: "3", code: "DL", name: "Delhi" },
];

let rowCounter = 0;

/** Build a fully-populated dataset row, overriding only the fields a test cares about. */
function makeRow(overrides: Partial<DatasetRow> = {}): DatasetRow {
  rowCounter += 1;
  return {
    public_id: `r_${rowCounter}`,
    service_slug: "passport",
    service_name: "Passport Application",
    department: "Ministry of External Affairs",
    state: "Maharashtra",
    district: "Mumbai",
    period_start: "2024-01-01",
    period_end: "2024-01-31",
    official_fee_reported_inr: "1500.00",
    additional_amount_reported_inr: "100.00",
    amount_paid_inr: "1600.00",
    paid: true,
    delay_days: 10,
    visits: 2,
    status: "submitted",
    description: "test report",
    created_at: "2024-02-01T00:00:00.000Z",
    ...overrides,
  };
}

/** The single StateGap for a given code (the function always returns one per state). */
function gapFor(gaps: StateGap[], code: string): StateGap {
  const gap = gaps.find((g) => g.code === code);
  if (gap === undefined) throw new Error(`no gap for ${code}`);
  return gap;
}

describe("deriveStateGaps", () => {
  it("returns one entry per reference state, in order, with safe defaults on an empty dataset", () => {
    const gaps = deriveStateGaps([], STATES);

    expect(gaps.map((g) => g.code)).toEqual(["MH", "KA", "DL"]);
    for (const gap of gaps) {
      expect(gap.additional_amount_median).toBeNull();
      expect(gap.report_count).toBe(0);
      expect(gap.services_covered).toBe(0);
      expect(gap.districts_covered).toBe(0);
    }
    // name is carried through from the reference list
    expect(gapFor(gaps, "MH").name).toBe("Maharashtra");
  });

  it("single report: the median equals that single value", () => {
    const gaps = deriveStateGaps(
      [makeRow({ state: "Maharashtra", additional_amount_reported_inr: "500.00" })],
      STATES,
    );

    const mh = gapFor(gaps, "MH");
    expect(mh.additional_amount_median).toBe("500.00");
    expect(mh.report_count).toBe(1);
  });

  it("odd count: the median is the middle value, not the mean", () => {
    // sorted [100, 200, 900] -> middle is 200; the mean would be 400
    const rows = [
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "900.00" }),
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "200.00" }),
    ];

    const mh = gapFor(deriveStateGaps(rows, STATES), "MH");
    expect(mh.additional_amount_median).toBe("200.00");
    expect(mh.report_count).toBe(3);
  });

  it("even count: the median is the average of the two middle values", () => {
    // two values -> their average
    const two = gapFor(
      deriveStateGaps(
        [
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "500.00" }),
        ],
        STATES,
      ),
      "MH",
    );
    expect(two.additional_amount_median).toBe("300.00");

    // four values -> average of the middle two (200, 300) = 250, distinct from the mean (275)
    const four = gapFor(
      deriveStateGaps(
        [
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "200.00" }),
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "300.00" }),
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "500.00" }),
        ],
        STATES,
      ),
      "MH",
    );
    expect(four.additional_amount_median).toBe("250.00");
  });

  it("buckets each state separately", () => {
    const rows = [
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "300.00" }),
      makeRow({ state: "Karnataka", additional_amount_reported_inr: "500.00" }),
    ];

    const gaps = deriveStateGaps(rows, STATES);
    const mh = gapFor(gaps, "MH");
    const ka = gapFor(gaps, "KA");
    const dl = gapFor(gaps, "DL");

    expect(mh.report_count).toBe(2);
    expect(mh.additional_amount_median).toBe("200.00");
    expect(ka.report_count).toBe(1);
    expect(ka.additional_amount_median).toBe("500.00");
    // Delhi had no reports -> safe defaults, still present
    expect(dl.report_count).toBe(0);
    expect(dl.additional_amount_median).toBeNull();
  });

  it("ignores rows whose state is not in the reference list", () => {
    const rows = [
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
      makeRow({ state: "Kerala", additional_amount_reported_inr: "9999.00" }), // unknown
    ];

    const gaps = deriveStateGaps(rows, STATES);

    // only the three reference states are returned; Kerala never appears
    expect(gaps).toHaveLength(3);
    expect(gaps.every((g) => ["MH", "KA", "DL"].includes(g.code))).toBe(true);
    // the unknown-state row did not leak into any bucket
    expect(gaps.reduce((sum, g) => sum + g.report_count, 0)).toBe(1);
  });

  it("excludes null additional_amount from the median but still counts the report", () => {
    const rows = [
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: null }),
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
      makeRow({ state: "Maharashtra", additional_amount_reported_inr: "300.00" }),
    ];

    const mh = gapFor(deriveStateGaps(rows, STATES), "MH");
    // median computed over [100, 300] only
    expect(mh.additional_amount_median).toBe("200.00");
    // but every row counts toward the report total
    expect(mh.report_count).toBe(3);
  });

  it("counts distinct services and districts covered", () => {
    const rows = [
      makeRow({ state: "Maharashtra", service_slug: "passport", district: "Mumbai" }),
      makeRow({ state: "Maharashtra", service_slug: "license", district: "Pune" }),
      makeRow({ state: "Maharashtra", service_slug: "passport", district: "Mumbai" }),
    ];

    const mh = gapFor(deriveStateGaps(rows, STATES), "MH");
    expect(mh.report_count).toBe(3);
    expect(mh.services_covered).toBe(2); // passport, license
    expect(mh.districts_covered).toBe(2); // Mumbai, Pune
  });

  it("formats the median as a fixed 2-decimal string", () => {
    // integer median still gets two decimals
    const integer = gapFor(
      deriveStateGaps(
        [makeRow({ state: "Maharashtra", additional_amount_reported_inr: "500.00" })],
        STATES,
      ),
      "MH",
    );
    expect(integer.additional_amount_median).toBe("500.00");
    expect(typeof integer.additional_amount_median).toBe("string");
    expect(integer.additional_amount_median).toMatch(/^\d+\.\d{2}$/);

    // fractional average -> ".50"
    const half = gapFor(
      deriveStateGaps(
        [
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "100.00" }),
          makeRow({ state: "Maharashtra", additional_amount_reported_inr: "101.00" }),
        ],
        STATES,
      ),
      "MH",
    );
    expect(half.additional_amount_median).toBe("100.50");

    // an already-fractional single value is preserved to two decimals
    const cents = gapFor(
      deriveStateGaps(
        [makeRow({ state: "Maharashtra", additional_amount_reported_inr: "1234.57" })],
        STATES,
      ),
      "MH",
    );
    expect(cents.additional_amount_median).toBe("1234.57");
    expect(cents.additional_amount_median).toMatch(/^\d+\.\d{2}$/);
  });
});

describe("deriveStateDelays", () => {
  it("returns a null delay for every state on an empty dataset", () => {
    const delays = deriveStateDelays([], STATES);

    expect(delays.size).toBe(3);
    expect(delays.get("MH")).toBeNull();
    expect(delays.get("KA")).toBeNull();
    expect(delays.get("DL")).toBeNull();
  });

  it("computes the median delay per state and null where there is no delay data", () => {
    const rows = [
      makeRow({ state: "Maharashtra", delay_days: 10 }),
      makeRow({ state: "Maharashtra", delay_days: 30 }),
      makeRow({ state: "Maharashtra", delay_days: 20 }),
      // Karnataka reports exist but carry no delay figure
      makeRow({ state: "Karnataka", delay_days: null }),
      // Delhi has no reports at all
    ];

    const delays = deriveStateDelays(rows, STATES);
    expect(delays.get("MH")).toBe(20); // median of [10, 20, 30]
    expect(delays.get("KA")).toBeNull(); // only null-delay rows -> no data
    expect(delays.get("DL")).toBeNull(); // no rows at all
  });

  it("ignores rows whose state is not in the reference list", () => {
    const rows = [
      makeRow({ state: "Kerala", delay_days: 999 }), // unknown state
      makeRow({ state: "Maharashtra", delay_days: 5 }),
    ];

    const delays = deriveStateDelays(rows, STATES);
    expect(delays.size).toBe(3); // no extra key for Kerala
    expect(delays.has("Kerala")).toBe(false);
    expect(delays.get("MH")).toBe(5);
  });
});

describe("deriveTotals", () => {
  it("returns zeros on an empty dataset", () => {
    expect(deriveTotals([], STATES)).toEqual({
      citizen_reports: 0,
      states_covered: 0,
      reports_corroborated: 0,
    });
  });

  it("counts every report, distinct known states, and corroborated statuses", () => {
    const rows = [
      makeRow({ state: "Maharashtra", status: "submitted" }),
      makeRow({ state: "Maharashtra", status: "corroborated" }),
      makeRow({ state: "Karnataka", status: "evidence_backed" }),
      makeRow({ state: "Delhi", status: "officially_acknowledged" }),
      // unknown state: still a citizen report, and still corroborated,
      // but does NOT add to states_covered
      makeRow({ state: "Kerala", status: "corroborated" }),
    ];

    const totals = deriveTotals(rows, STATES);
    expect(totals.citizen_reports).toBe(5); // all rows, including the unknown state
    expect(totals.states_covered).toBe(3); // MH, KA, DL — Kerala excluded
    // corroborated set = {corroborated, evidence_backed, officially_acknowledged}
    // matches: MH corroborated, KA evidence_backed, DL officially_acknowledged, Kerala corroborated
    expect(totals.reports_corroborated).toBe(4);
  });

  it("does not double-count a state seen in multiple reports", () => {
    const rows = [
      makeRow({ state: "Maharashtra" }),
      makeRow({ state: "Maharashtra" }),
      makeRow({ state: "Maharashtra" }),
    ];

    const totals = deriveTotals(rows, STATES);
    expect(totals.citizen_reports).toBe(3);
    expect(totals.states_covered).toBe(1);
  });
});

describe("deriveStateServices", () => {
  it("returns an empty list on an empty dataset", () => {
    expect(deriveStateServices([], "Maharashtra")).toEqual([]);
  });

  it("returns an empty list when the state has no matching rows", () => {
    const rows = [makeRow({ state: "Karnataka" })];
    expect(deriveStateServices(rows, "Maharashtra")).toEqual([]);
  });

  it("groups by service within a state, computes per-service medians, and sorts by report count", () => {
    const rows = [
      // passport: 3 reports, amounts [100, 200, 300] -> median 200; delays [10, 20, 30] -> median 20
      makeRow({
        state: "Maharashtra",
        service_slug: "passport",
        service_name: "Passport Application",
        department: "Ministry of External Affairs",
        additional_amount_reported_inr: "100.00",
        delay_days: 10,
      }),
      makeRow({
        state: "Maharashtra",
        service_slug: "passport",
        additional_amount_reported_inr: "200.00",
        delay_days: 20,
      }),
      makeRow({
        state: "Maharashtra",
        service_slug: "passport",
        additional_amount_reported_inr: "300.00",
        delay_days: 30,
      }),
      // license: 1 report
      makeRow({
        state: "Maharashtra",
        service_slug: "license",
        service_name: "Driving License",
        department: "Regional Transport Office",
        additional_amount_reported_inr: "500.00",
        delay_days: 5,
      }),
    ];

    const services = deriveStateServices(rows, "Maharashtra");
    expect(services).toHaveLength(2);

    // sorted by report_count descending: passport (3) before license (1)
    expect(services[0].slug).toBe("passport");
    expect(services[0].name).toBe("Passport Application");
    expect(services[0].department).toBe("Ministry of External Affairs");
    expect(services[0].report_count).toBe(3);
    expect(services[0].additional_amount_median).toBe("200.00");
    expect(services[0].delay_median).toBe(20);

    expect(services[1].slug).toBe("license");
    expect(services[1].report_count).toBe(1);
    expect(services[1].additional_amount_median).toBe("500.00");
    expect(services[1].delay_median).toBe(5);
  });

  it("respects the limit", () => {
    const rows = [
      makeRow({ state: "Maharashtra", service_slug: "passport" }),
      makeRow({ state: "Maharashtra", service_slug: "passport" }),
      makeRow({ state: "Maharashtra", service_slug: "license" }),
    ];

    const limited = deriveStateServices(rows, "Maharashtra", 1);
    expect(limited).toHaveLength(1);
    expect(limited[0].slug).toBe("passport"); // the most-reported one

    // default limit is 5, so both fit when unspecified
    expect(deriveStateServices(rows, "Maharashtra")).toHaveLength(2);
  });

  it("matches the state name case-insensitively", () => {
    const rows = [makeRow({ state: "Maharashtra", service_slug: "passport" })];
    expect(deriveStateServices(rows, "maharashtra")).toHaveLength(1);
    expect(deriveStateServices(rows, "MAHARASHTRA")).toHaveLength(1);
  });

  it("picks the strongest verification status across a service's reports", () => {
    const rows = [
      makeRow({ state: "Karnataka", service_slug: "passport", status: "submitted" }),
      makeRow({ state: "Karnataka", service_slug: "passport", status: "officially_acknowledged" }),
      makeRow({ state: "Karnataka", service_slug: "passport", status: "validated" }),
    ];

    const [service] = deriveStateServices(rows, "Karnataka");
    // ranks: submitted(1) < validated(2) < officially_acknowledged(5)
    expect(service.strongest_status).toBe("officially_acknowledged");
  });

  it("leaves strongest_status null when no report carries a ranked status", () => {
    const rows = [
      makeRow({ state: "Karnataka", service_slug: "license", status: "rejected" }),
      makeRow({ state: "Karnataka", service_slug: "license", status: "withdrawn" }),
    ];

    const [service] = deriveStateServices(rows, "Karnataka");
    expect(service.strongest_status).toBeNull();
  });

  it("returns a null median when a service has only null amounts, but still counts the reports", () => {
    const rows = [
      makeRow({ state: "Maharashtra", service_slug: "passport", additional_amount_reported_inr: null }),
      makeRow({ state: "Maharashtra", service_slug: "passport", additional_amount_reported_inr: null }),
    ];

    const [service] = deriveStateServices(rows, "Maharashtra");
    expect(service.additional_amount_median).toBeNull();
    expect(service.report_count).toBe(2);
  });
});
