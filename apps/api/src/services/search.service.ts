import type { Db } from "@rishwat/database";
import { sql, type SQL } from "drizzle-orm";
import { execRows, PUBLISHABLE_STATUSES } from "../utils/sql.js";

export interface SearchFilters {
  department?: string | undefined;
  state?: string | undefined;
  district?: string | undefined;
  page: number;
  perPage: number;
}

export interface SearchItem {
  slug: string;
  name: string;
  department: string;
  description: string | null;
  report_count: number;
}

export interface SearchResult {
  total: number;
  items: SearchItem[];
}

type Row = SearchItem & { total_count: number };

/**
 * Search the service catalog. `q` is matched three ways (any hit qualifies):
 *  1. PostgreSQL full-text search over name+description (`plainto_tsquery`);
 *  2. `ILIKE` substring on the name (cheap fallback for partial words);
 *  3. `pg_trgm` similarity on the name (typo tolerance).
 *
 * `report_count` is the number of *publishable* reports for the service,
 * optionally scoped to the state/district filter. All values are bound
 * parameters — nothing user-supplied is concatenated into the SQL text.
 */
export async function searchServices(
  db: Db,
  q: string | undefined,
  filters: SearchFilters,
): Promise<SearchResult> {
  const { department, state, district, page, perPage } = filters;
  const offset = (page - 1) * perPage;
  const term = q?.trim();

  const where: SQL[] = [];
  if (department) where.push(sql`d.slug = ${department}`);
  if (term) {
    const like = `%${term}%`;
    where.push(sql`(
      to_tsvector('english', s.name || ' ' || coalesce(s.description, ''))
        @@ plainto_tsquery('english', ${term})
      or s.name ilike ${like}
      or similarity(s.name, ${term}) >= 0.2
    )`);
  }
  const whereSql = where.length ? sql`where ${sql.join(where, sql` and `)}` : sql``;

  const rcWhere: SQL[] = [
    sql`rp.service_id = s.id`,
    sql`rp.status in ${PUBLISHABLE_STATUSES}`,
  ];
  if (state) rcWhere.push(sql`st.name = ${state}`);
  if (district) rcWhere.push(sql`di.name = ${district}`);
  const reportCount = sql`(
    select count(*)::int from reports rp
    join states st on st.id = rp.state_id
    join districts di on di.id = rp.district_id
    where ${sql.join(rcWhere, sql` and `)}
  )`;

  const order = term
    ? sql`order by greatest(
        ts_rank(
          to_tsvector('english', s.name || ' ' || coalesce(s.description, '')),
          plainto_tsquery('english', ${term})
        ),
        similarity(s.name, ${term})
      ) desc, s.name asc`
    : sql`order by s.name asc`;

  const rows = await execRows<Row>(
    db,
    sql`
      select s.slug, s.name, d.name as department, s.description,
        ${reportCount} as report_count,
        (count(*) over())::int as total_count
      from services s
      join departments d on d.id = s.department_id
      ${whereSql}
      ${order}
      limit ${perPage} offset ${offset}
    `,
  );

  const total = rows.length > 0 ? (rows[0] as Row).total_count : 0;
  const items = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    department: r.department,
    description: r.description,
    report_count: r.report_count,
  }));
  return { total, items };
}
