import { sql, type SQL } from "drizzle-orm";
import { execRows, type Queryable } from "../utils/sql.js";
import { findDuplicateGroup } from "./duplication.service.js";

export interface AbuseInput {
  serviceId: string;
  districtId: string;
  ipHash?: string | null;
  deviceHash?: string | null;
  description: string;
}

export interface AbuseResult {
  score: number;
  signals: string[];
}

export interface CoordinatedCluster {
  ip_hash_prefix: string;
  service_id: string;
  report_count: number;
}

const MAX_SCORE = 100;

async function countReports(db: Queryable, cond: SQL): Promise<number> {
  const [row] = await execRows<{ n: number }>(
    db,
    sql`select count(*)::int as n from reports where ${cond}`,
  );
  return row?.n ?? 0;
}

/**
 * Heuristic abuse score for an incoming report. Signals are additive and capped
 * at 100. This never blocks a submission on its own — it feeds moderation triage
 * (a higher score is reviewed sooner). Only hashes are inspected (PII rule).
 */
export async function evaluateAbuse(db: Queryable, input: AbuseInput): Promise<AbuseResult> {
  const { serviceId, districtId, ipHash, deviceHash, description } = input;
  let score = 0;
  const signals: string[] = [];

  // 1. Near-duplicate description for the same (service, district) cell.
  const dup = await findDuplicateGroup(db, serviceId, districtId, description);
  if (dup.isDuplicate) {
    score += 40;
    signals.push("duplicate_content");
  }

  // 2. A single IP bucket flooding one service in the last 24h.
  if (ipHash) {
    const n = await countReports(
      db,
      sql`service_id = ${serviceId} and ip_hash = ${ipHash} and created_at >= now() - interval '24 hours'`,
    );
    if (n > 5) {
      score += 30;
      signals.push("ip_flood_same_service");
    }
  }

  // 3. A single device fingerprint across any services in the last 24h.
  if (deviceHash) {
    const n = await countReports(
      db,
      sql`device_fingerprint_hash = ${deviceHash} and created_at >= now() - interval '24 hours'`,
    );
    if (n > 5) {
      score += 20;
      signals.push("device_flood");
    }
  }

  // 4. Coordinated burst: 3+ reports for the same (service, district) within 1h.
  const burst = await countReports(
    db,
    sql`service_id = ${serviceId} and district_id = ${districtId} and created_at >= now() - interval '1 hour'`,
  );
  if (burst >= 3) {
    score += 50;
    signals.push("coordinated_burst");
  }

  return { score: Math.min(score, MAX_SCORE), signals };
}

/**
 * Surface (IP bucket, service) pairs with an unusually high report count in the
 * window — a proxy for coordinated campaigns. Only a short prefix of the digest
 * is returned so operators can correlate clusters without handling full hashes.
 */
export async function findCoordinatedClusters(
  db: Queryable,
  windowHours = 24,
): Promise<CoordinatedCluster[]> {
  return execRows<CoordinatedCluster>(
    db,
    sql`
      select left(ip_hash, 12) as ip_hash_prefix,
        service_id::text as service_id,
        count(*)::int as report_count
      from reports
      where ip_hash is not null
        and created_at >= now() - make_interval(hours => ${windowHours})
      group by ip_hash, service_id
      having count(*) >= 5
      order by count(*) desc
      limit 200
    `,
  );
}
