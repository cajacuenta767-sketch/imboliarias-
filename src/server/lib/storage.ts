import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageAdapter {
  save(file: File, folder: string): Promise<{ url: string; name: string; size: number; mimeType: string }>;
  remove(url: string): Promise<void>;
}

/** Almacenamiento local en public/uploads. Cambiar por S3/R2 implementando la misma interfaz. */
export class LocalStorage implements StorageAdapter {
  private root = path.join(process.cwd(), "public", "uploads");

  async save(file: File, folder: string) {
    const ext = path.extname(file.name).toLowerCase() || ".bin";
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "") || "general";
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const dir = path.join(this.root, safeFolder);
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    return { url: `/uploads/${safeFolder}/${name}`, name: file.name, size: buf.length, mimeType: file.type };
  }

  async remove(url: string) {
    if (!url.startsWith("/uploads/")) return;
    await unlink(path.join(process.cwd(), "public", url)).catch(() => undefined);
  }
}

export const storage: StorageAdapter = new LocalStorage();
