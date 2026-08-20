import type { Db } from "@rishwat/database";
import type { AppConfig } from "./config.js";
import type { EvidenceStorage } from "./storage/evidence.storage.js";

export type Role = "moderator" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

// Hono generics for this app. `db`, `storage` and `config` are injected once by
// createApp (see app.ts) so every route/middleware can read them from context;
// `user` is set by the auth middleware on protected routes.
export interface AppEnv {
  Variables: {
    db: Db;
    storage: EvidenceStorage;
    config: AppConfig;
    user: AuthUser;
  };
}
