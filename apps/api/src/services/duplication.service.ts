import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { execRows, type Queryable } from "../utils/sql.js";

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateGroupId: string | null;
}

interface MatchRow {
  id: string;
  duplicate_group_id: string | null;
  sim: number;
}

/**
 * Find whether `description` is a near-duplicate of an existing report for the
 * same (service, district) within `sinceDays`, using `pg_trgm` similarity with
 * a 0.75 threshold. If a match is found, both the matched report and the new
 * report join a shared `duplicate_group_id` (created lazily if the match had
 * none). Works with a `Db` or a transaction handle.
 */
export async function findDuplicateGroup(
  db: Queryable,
  serviceId: string,
  districtId: string,
  description: string,
  sinceDays = 90,
): Promise<DuplicateResult> {
  const [match] = await execRows<MatchRow>(
    db,
    sql`
      select id, duplicate_group_id, similarity(description, ${description}) as sim
      from reports
      where service_id = ${serviceId}
        and district_id = ${districtId}
        and created_at >= now() - make_interval(days => ${sinceDays})
        and similarity(description, ${description}) >= 0.75
      order by sim desc
      limit 1
    `,
  );

  if (!match) return { isDuplicate: false, duplicateGroupId: null };

  if (match.duplicate_group_id) {
    return { isDuplicate: true, duplicateGroupId: match.duplicate_group_id };
  }

  // The matched report has no group yet — start one and back-fill it.
  const groupId = randomUUID();
  await db.execute(sql`
    update reports set duplicate_group_id = ${groupId}
    where id = ${match.id} and duplicate_group_id is null
  `);
  return { isDuplicate: true, duplicateGroupId: groupId };
}
