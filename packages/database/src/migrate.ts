import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const client = postgres(url, { max: 1 });
const db = drizzle(client);

// Drizzle emits migrations to ./drizzle relative to the package root
// (see drizzle.config.ts `out`). This file lives in ./src, so go up one level.
const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "drizzle",
);

async function main() {
  // 1. Extensions first — the schema depends on them (citext for users.email,
  //    postgis for offices.location + GiST index). Same set is enabled on
  //    Supabase in production (see docs/supabase-deployment.md).
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS citext`);

  // 2. Apply the generated table/enum/index migrations. This creates `services`.
  await migrate(db, { migrationsFolder });

  // 3. Full-text search trigger — installed AFTER migrations so the `services`
  //    table exists. Keeps services.search_vector in sync with name/description.
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION services_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english', NEW.name || ' ' || COALESCE(NEW.description, ''));
      RETURN NEW;
    END $$ LANGUAGE plpgsql;
  `);
  await db.execute(sql`DROP TRIGGER IF EXISTS services_search_vector_trigger ON services`);
  await db.execute(sql`
    CREATE TRIGGER services_search_vector_trigger
      BEFORE INSERT OR UPDATE OF name, description ON services
      FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();
  `);

  await client.end();
  console.log("Migrations + extensions + search trigger applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
