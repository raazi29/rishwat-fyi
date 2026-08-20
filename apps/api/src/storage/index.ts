import type { StorageConfig } from "../config.js";
import type { EvidenceStorage } from "./evidence.storage.js";
import { LocalStorage } from "./local.storage.js";
import { SupabaseStorage } from "./supabase.storage.js";

export type { EvidenceStorage, EvidenceObject, PutResult } from "./evidence.storage.js";

/** Build the evidence storage backend from configuration. */
export function createEvidenceStorage(config: StorageConfig): EvidenceStorage {
  switch (config.driver) {
    case "local":
      return new LocalStorage(config.dir);
    case "supabase":
      return new SupabaseStorage({
        url: config.url,
        serviceRoleKey: config.serviceRoleKey,
        bucket: config.bucket,
      });
  }
}
