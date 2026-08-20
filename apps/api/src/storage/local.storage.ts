import { promises as fs } from "node:fs";
import path from "node:path";
import type { EvidenceObject, EvidenceStorage, PutResult } from "./evidence.storage.js";

// Filesystem-backed evidence storage (development / self-hosting). Content type
// is preserved in a sibling ".meta" file so get() can return it faithfully.
export class LocalStorage implements EvidenceStorage {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
  }

  private resolveKey(key: string): string {
    const full = path.resolve(this.baseDir, key);
    const rel = path.relative(this.baseDir, full);
    if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return full;
  }

  async put(key: string, data: Uint8Array, contentType: string): Promise<PutResult> {
    const full = this.resolveKey(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    await fs.writeFile(`${full}.meta`, contentType, "utf8");
    return { key, size: data.byteLength };
  }

  async get(key: string): Promise<EvidenceObject | null> {
    const full = this.resolveKey(key);
    try {
      const buf = await fs.readFile(full);
      let contentType = "application/octet-stream";
      try {
        const meta = (await fs.readFile(`${full}.meta`, "utf8")).trim();
        if (meta) contentType = meta;
      } catch {
        // no sidecar — fall back to octet-stream
      }
      return { data: new Uint8Array(buf), contentType, size: buf.byteLength };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    const full = this.resolveKey(key);
    await fs.rm(full, { force: true });
    await fs.rm(`${full}.meta`, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    const full = this.resolveKey(key);
    try {
      await fs.access(full);
      return true;
    } catch {
      return false;
    }
  }
}

function isNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "ENOENT";
}
