import { z } from "zod";
import { db } from "@/server/db";
import { badRequest } from "@/server/errors";
import { storage } from "@/server/lib/storage";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf", "video/mp4"];
const MAX = 15 * 1024 * 1024;

export const mediaQuerySchema = paginationSchema.extend({ folder: z.string().optional(), q: z.string().optional() });

export async function uploadMedia(file: File, folder: string, userId?: string) {
  if (!ALLOWED.includes(file.type)) throw badRequest(`Tipo de archivo no permitido: ${file.type}`);
  if (file.size > MAX) throw badRequest("El archivo supera 15 MB");
  const saved = await storage.save(file, folder);
  return db.media.create({ data: { ...saved, folder, userId: userId ?? null } });
}

export async function listMedia(q: z.infer<typeof mediaQuerySchema>) {
  const where = { ...(q.folder ? { folder: q.folder } : {}), ...(q.q ? { name: { contains: q.q } } : {}) };
  const [items, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.media.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export async function deleteMedia(id: string) {
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return;
  await storage.remove(m.url);
  await db.media.delete({ where: { id } });
}

export const mediaFolders = async () => {
  const rows = await db.media.groupBy({ by: ["folder"], _count: true });
  return rows.map((r) => ({ folder: r.folder, count: r._count }));
};
