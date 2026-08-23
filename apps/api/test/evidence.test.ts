import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sha256Hex } from "../src/utils/hashing.js";
import { bootTestApp } from "./helpers.js";

/**
 * Covers POST /evidence, which is how a citizen attaches a receipt or photo to
 * a report they just filed. Two things are being proved here:
 *
 *   1. The submitter path works with the identifiers the web client actually
 *      holds — the public id ("R-xxxxxxxx") plus the one-time token from
 *      POST /reports. The internal report uuid is never exposed publicly, so
 *      public_id has to be accepted or the upload can never succeed.
 *   2. Nobody else can attach evidence. A moderator accepting evidence
 *      promotes its report to `evidence_backed` (the second-highest rung of
 *      the verification ladder in plan/Rishwat.fyi.md section 8), so an
 *      unauthenticated upload would let a stranger manufacture that promotion
 *      on someone else's report.
 *
 * A wrong token and an unknown report must be indistinguishable — both 404 —
 * so that this endpoint cannot be used to test whether a report id exists.
 */

let boot: Awaited<ReturnType<typeof bootTestApp>>;
let app: Awaited<ReturnType<typeof bootTestApp>>["app"];

const DESC = "Evidence test report — long enough to satisfy the description length rule.";

const OWNER_TOKEN = "evidence-owner-one-time-token";
const OTHER_TOKEN = "evidence-other-one-time-token";

let ownerPublicId: string;
let ownerReportId: string;
let otherPublicId: string;

const reportIds: string[] = [];
let pendingEvidenceId: string;
let acceptedEvidenceId: string;
let rejectedEvidenceId: string;

function pngFile(): File {
  return new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "receipt.png", {
    type: "image/png",
  });
}

/** Insert a report directly with a known token digest, bypassing rate limits. */
async function seedReport(token: string): Promise<{ publicId: string; id: string }> {
  const publicId = `R-${Math.random().toString(36).slice(2, 10)}`;
  const rows = (await boot.db.execute(sql`
    insert into reports
      (public_id, service_id, state_id, district_id, period_start, period_end, description, submission_token_hash)
    values
      (${publicId}, ${serviceId}::uuid, ${stateId}::uuid, ${districtId}::uuid,
       '2024-01-01', '2024-02-01', ${DESC}, ${sha256Hex(token)})
    returning id::text as id
  `)) as any;
  const id = rows[0].id as string;
  reportIds.push(id);
  return { publicId, id };
}

let serviceId: string;
let stateId: string;
let districtId: string;

beforeAll(async () => {
  boot = await bootTestApp();
  app = boot.app;

  const svc = (await boot.db.execute(sql`select id::text as id from services limit 1`)) as any;
  serviceId = svc[0].id;
  const loc = (await boot.db.execute(
    sql`select id::text as id, state_id::text as state_id from districts limit 1`,
  )) as any;
  districtId = loc[0].id;
  stateId = loc[0].state_id;

  const owner = await seedReport(OWNER_TOKEN);
  ownerPublicId = owner.publicId;
  ownerReportId = owner.id;
  otherPublicId = (await seedReport(OTHER_TOKEN)).publicId;

  const visibilityRows = (await boot.db.execute(sql`
    insert into evidence
      (report_id, storage_key, mime_type, size_bytes, sha256, status, retention_until)
    values
      (${ownerReportId}::uuid, 'test/pending', 'image/png', 8, ${"1".repeat(64)}, 'pending_review', now() + interval '90 days'),
      (${ownerReportId}::uuid, 'test/accepted', 'image/png', 8, ${"2".repeat(64)}, 'accepted', now() + interval '90 days'),
      (${ownerReportId}::uuid, 'test/rejected', 'image/png', 8, ${"3".repeat(64)}, 'rejected', now() + interval '90 days')
    returning id::text as id, status
  `)) as unknown as { id: string; status: string }[];
  pendingEvidenceId = visibilityRows.find((row) => row.status === "pending_review")!.id;
  acceptedEvidenceId = visibilityRows.find((row) => row.status === "accepted")!.id;
  rejectedEvidenceId = visibilityRows.find((row) => row.status === "rejected")!.id;
});

afterAll(async () => {
  for (const id of reportIds) {
    await boot.db.execute(sql`delete from reports where id = ${id}::uuid`);
  }
  await boot.cleanup();
});

describe("POST /evidence — submitter upload", () => {
  it("accepts public_id plus the submitter's one-time token", async () => {
    const form = new FormData();
    form.append("public_id", ownerPublicId);
    form.append("token", OWNER_TOKEN);
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(201);

    const body = (await res.json()) as { id: string; status: string; report_id?: string };
    // Public upload receipts must not expose the internal report UUID.
    expect(body).not.toHaveProperty("report_id");
    // Evidence always lands in moderation rather than going live immediately.
    expect(body.status).toBe("pending_review");
    expect(typeof body.id).toBe("string");
  });

  it("still accepts the internal report_id for server-side callers", async () => {
    const form = new FormData();
    form.append("report_id", ownerReportId);
    form.append("token", OWNER_TOKEN);
    // Distinct bytes: the storage key is report/sha256, so reusing the same
    // file as the test above would collide on an already-written key.
    form.append("file", new File([new Uint8Array([1, 2, 3, 4, 5])], "second.png", { type: "image/png" }));

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(201);
  });
});

describe("POST /evidence — ownership", () => {
  it("rejects an upload with no token", async () => {
    const form = new FormData();
    form.append("public_id", ownerPublicId);
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });

  it("rejects a wrong token with 404, not 403", async () => {
    const form = new FormData();
    form.append("public_id", ownerPublicId);
    form.append("token", "not-the-right-token");
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(404);
  });

  it("rejects another report's token — evidence cannot be planted", async () => {
    const form = new FormData();
    form.append("public_id", ownerPublicId);
    form.append("token", OTHER_TOKEN);
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(404);
  });

  it("returns the same 404 for an unknown report as for a wrong token", async () => {
    const form = new FormData();
    form.append("public_id", "R-zzzzzzzz");
    form.append("token", OWNER_TOKEN);
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(404);
  });

  it("rejects a malformed public_id", async () => {
    const form = new FormData();
    form.append("public_id", "not-a-report-id");
    form.append("token", OWNER_TOKEN);
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });

  it("rejects a request carrying neither public_id nor report_id", async () => {
    const form = new FormData();
    form.append("token", OWNER_TOKEN);
    form.append("file", pngFile());

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });
});

describe("POST /evidence — content rules", () => {
  it("rejects an unsupported content type", async () => {
    const form = new FormData();
    form.append("public_id", ownerPublicId);
    form.append("token", OWNER_TOKEN);
    form.append("file", new File([new Uint8Array([1, 2, 3])], "notes.txt", { type: "text/plain" }));

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });

  it("rejects an empty file", async () => {
    const form = new FormData();
    form.append("public_id", ownerPublicId);
    form.append("token", OWNER_TOKEN);
    form.append("file", new File([], "empty.png", { type: "image/png" }));

    const res = await app.request("/evidence", { method: "POST", body: form });
    expect(res.status).toBe(400);
  });
});



describe("public evidence metadata visibility", () => {
  it("returns accepted evidence metadata", async () => {
    const res = await app.request(`/evidence/${acceptedEvidenceId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; status: string; report_id?: string };
    expect(body.id).toBe(acceptedEvidenceId);
    expect(body.status).toBe("accepted");
    expect(body).not.toHaveProperty("report_id");
  });

  it("hides pending-review evidence metadata", async () => {
    const res = await app.request(`/evidence/${pendingEvidenceId}`);
    expect(res.status).toBe(404);
  });

  it("hides rejected evidence metadata", async () => {
    const res = await app.request(`/evidence/${rejectedEvidenceId}`);
    expect(res.status).toBe(404);
  });

  it("lists only accepted evidence on a public report", async () => {
    const res = await app.request(`/reports/${ownerPublicId}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      evidence: { id: string; status: string; report_id?: string }[];
    };
    expect(body.evidence.map((entry) => entry.id)).toEqual([acceptedEvidenceId]);
    expect(body.evidence[0]?.status).toBe("accepted");
    expect(body.evidence[0]).not.toHaveProperty("report_id");
  });
});
