import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageAdapter {
  save(file: File, folder: string, ext: string): Promise<{ url: string; name: string; size: number; mimeType: string }>;
  remove(url: string): Promise<void>;
}

/** Almacenamiento local en public/uploads. Cambiar por S3/R2 implementando la misma interfaz. */
export class LocalStorage implements StorageAdapter {
  private root = path.join(process.cwd(), "public", "uploads");

  /**
   * `ext` la decide el servidor a partir del tipo MIME verificado (nunca del nombre del archivo),
   * así un cliente no puede colar un .html/.svg que el servidor sirva como página.
   */
  async save(file: File, folder: string, ext: string) {
    const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "").toLowerCase() || "general";
    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const dir = path.join(this.root, safeFolder);
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);
    return { url: `/uploads/${safeFolder}/${name}`, name: path.basename(file.name).slice(0, 180), size: buf.length, mimeType: file.type };
  }

  async remove(url: string) {
    if (!url.startsWith("/uploads/")) return;
    const target = path.resolve(process.cwd(), "public", `.${url}`);
    if (!target.startsWith(this.root + path.sep)) return;
    await unlink(target).catch(() => undefined);
  }
}

export const storage: StorageAdapter = new LocalStorage();
