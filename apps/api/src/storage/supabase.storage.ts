import { StorageClient } from "@supabase/storage-js";
import type { EvidenceObject, EvidenceStorage, PutResult } from "./evidence.storage.js";

export interface SupabaseStorageOptions {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

// Production evidence storage backed by Supabase Storage. Uses the service-role
// key server-side (never exposed to clients).
export class SupabaseStorage implements EvidenceStorage {
  private readonly client: StorageClient;
  private readonly bucket: string;

  constructor(opts: SupabaseStorageOptions) {
    const baseUrl = opts.url.replace(/\/+$/, "");
    this.client = new StorageClient(`${baseUrl}/storage/v1`, {
      apikey: opts.serviceRoleKey,
      Authorization: `Bearer ${opts.serviceRoleKey}`,
    });
    this.bucket = opts.bucket;
  }

  private get files() {
    return this.client.from(this.bucket);
  }

  async put(key: string, data: Uint8Array, contentType: string): Promise<PutResult> {
    const { error } = await this.files.upload(key, data, { contentType, upsert: true });
    if (error) throw error;
    return { key, size: data.byteLength };
  }

  async get(key: string): Promise<EvidenceObject | null> {
    const { data, error } = await this.files.download(key);
    if (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
    if (!data) return null;
    const bytes = new Uint8Array(await data.arrayBuffer());
    return {
      data: bytes,
      contentType: data.type || "application/octet-stream",
      size: bytes.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.files.remove([key]);
    if (error) throw error;
  }

  async exists(key: string): Promise<boolean> {
    const slash = key.lastIndexOf("/");
    const folder = slash === -1 ? "" : key.slice(0, slash);
    const name = slash === -1 ? key : key.slice(slash + 1);
    const { data, error } = await this.files.list(folder, { search: name, limit: 100 });
    if (error) throw error;
    return Boolean(data?.some((f) => f.name === name));
  }
}

function isNotFound(error: unknown): boolean {
  const e = error as { statusCode?: string | number; status?: number; message?: string };
  return (
    e.statusCode === "404" ||
    e.statusCode === 404 ||
    e.status === 404 ||
    (typeof e.message === "string" && /not.?found/i.test(e.message))
  );
}
