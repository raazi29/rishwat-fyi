import { serve } from "@hono/node-server";
import { createDb } from "@rishwat/database";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createEvidenceStorage } from "./storage/index.js";

const config = loadConfig();
const { db } = createDb(config.databaseUrl);
const storage = createEvidenceStorage(config.storage);
const app = createApp(db, storage, config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Rishwat API listening on http://localhost:${info.port}`);
});
