import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { bootTestApp, createTestAdmin } from "./helpers.js";

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];
let adminToken: string;
let serviceId: string;
let stateId: string;
let districtId: string;

const description =
  "Officials asked me to come back several times and the process was very unclear throughout.";

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;
  adminToken = (await createTestAdmin(boot.db, boot.config)).token;
  const svc = (await boot.db.execute(sql`select id::text as id from services limit 1`)) as any;
  serviceId = svc[0].id;
  const loc = (await boot.db.execute(
    sql`select id::text as id, state_id::text as state_id from districts limit 1`,
  )) as any;
  districtId = loc[0].id;
  stateId = loc[0].state_id;
});

afterAll(async () => {
  await boot.cleanup();
});

async function submitReport(): Promise<string> {
  const res = await app.request("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      state_id: stateId,
      district_id: districtId,
      period_start: "2024-03-01",
      period_end: "2024-03-15",
      visits: 4,
      description,
    }),
  });
  const body = (await res.json()) as { public_id: string };
  return body.public_id;
}

function decide(body: unknown) {
  return app.request("/admin/reports/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(body),
  });
}

describe("admin moderation", () => {
  it("shows a submitted report in the queue", async () => {
    const publicId = await submitReport();
    // Force it to the top of the queue (ordered by abuse_score desc) so it is
    // deterministically on the first page regardless of other reports.
    await boot.db.execute(sql`update reports set abuse_score = 100 where public_id = ${publicId}`);

    const res = await app.request("/admin/queue?per_page=100", {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; items: { public_id: string }[] };
    expect(body.total).toBeGreaterThan(0);
    expect(body.items.some((r) => r.public_id === publicId)).toBe(true);
  });

  it("preserves the queue total when the requested page is beyond the result set", async () => {
    await submitReport();
    const headers = { authorization: `Bearer ${adminToken}` };

    const firstPage = await app.request("/admin/queue?per_page=1", { headers });
    expect(firstPage.status).toBe(200);
    const firstBody = (await firstPage.json()) as { total: number };
    expect(firstBody.total).toBeGreaterThan(0);

    const beyond = await app.request("/admin/queue?page=999999&per_page=1", { headers });
    expect(beyond.status).toBe(200);
    const beyondBody = (await beyond.json()) as { total: number; items: unknown[] };
    expect(beyondBody.items).toEqual([]);
    expect(beyondBody.total).toBeGreaterThanOrEqual(firstBody.total);
  });

  it("validates a report with mark_validated", async () => {
    const publicId = await submitReport();
    const res = await decide({ public_id: publicId, action: "mark_validated" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { from_status: string; to_status: string };
    expect(body.from_status).toBe("submitted");
    expect(body.to_status).toBe("validated");
  });

  it("returns 409 when rejecting an already-rejected report", async () => {
    const publicId = await submitReport();
    const first = await decide({ public_id: publicId, action: "reject" });
    expect(first.status).toBe(200);

    const second = await decide({ public_id: publicId, action: "reject" });
    expect(second.status).toBe(409);
    const body = (await second.json()) as { error: { code: string } };
    expect(body.error.code).toBe("conflict");
  });
});
