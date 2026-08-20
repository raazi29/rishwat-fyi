import { createDb } from "@rishwat/database";
import { createUser } from "../services/auth.service.js";

/**
 * Create (or rotate) the bootstrap admin account. Idempotent: re-running with a
 * new password updates the existing user (see createUser's upsert). Reads
 * DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (and optional ADMIN_NAME) from env.
 *
 *   ADMIN_EMAIL=you@example.org ADMIN_PASSWORD=... npm run create-admin
 */
async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  const { db, client } = createDb(databaseUrl);
  try {
    const user = await createUser(db, {
      email,
      password,
      role: "admin",
      name: process.env.ADMIN_NAME,
    });
    console.log(`\u2713 Admin ready: ${user.email} (role=${user.role}, id=${user.id})`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("create-admin failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
