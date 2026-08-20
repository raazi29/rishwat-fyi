// Storage abstraction for uploaded evidence files. Two real implementations
// exist: LocalStorage (filesystem, dev) and SupabaseStorage (production).

export interface PutResult {
  key: string;
  size: number;
}

export interface EvidenceObject {
  data: Uint8Array;
  contentType: string;
  size: number;
}

export interface EvidenceStorage {
  /** Store bytes under `key`, overwriting if present. */
  put(key: string, data: Uint8Array, contentType: string): Promise<PutResult>;
  /** Fetch an object, or null if it does not exist. */
  get(key: string): Promise<EvidenceObject | null>;
  /** Delete an object; no-op if it does not exist. */
  delete(key: string): Promise<void>;
  /** Whether an object exists. */
  exists(key: string): Promise<boolean>;
}
