import { z } from "zod";
import { db } from "@/server/db";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { storage } from "@/server/lib/storage";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import type { SessionUser } from "@/server/auth/guards";

/** Tipos permitidos y la extensión con la que se guardan (decidida por el servidor). */
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
};
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 20;

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);

/** Detecta el tipo real por los primeros bytes; devuelve null si no coincide con ningún tipo permitido. */
export function sniffMime(buf: Uint8Array): string | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = String.fromCharCode(...buf.slice(8, 12));
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
    return "video/mp4";
  }
  return null;
}

export const mediaQuerySchema = paginationSchema.extend({ folder: z.string().max(40).optional(), q: z.string().max(100).optional() });

/** Carpeta a la que puede subir un visitante sin sesión (hoja de vida de una postulación). Solo PDF. */
export const ANONYMOUS_FOLDER = "resumes";

export async function uploadMedia(file: File, folder: string, user: SessionUser | null) {
  if (file.size === 0) throw badRequest("El archivo está vacío");
  if (file.size > MAX_FILE_BYTES) throw badRequest("El archivo supera 15 MB");
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const real = sniffMime(head);
  if (!real || !ALLOWED[real]) throw badRequest(`Tipo de archivo no permitido: ${file.type || "desconocido"}`);
  if (!user && (folder !== ANONYMOUS_FOLDER || real !== "application/pdf")) throw forbidden("Inicia sesión para subir archivos");
  const typed = new File([file], file.name, { type: real });
  const saved = await storage.save(typed, folder, ALLOWED[real]);
  return db.media.create({ data: { ...saved, mimeType: real, folder: folder.replace(/[^a-z0-9-_]/gi, "").toLowerCase() || "general", userId: user?.id ?? null } });
}

export async function listMedia(q: z.infer<typeof mediaQuerySchema>, user: SessionUser) {
  // Cada usuario ve solo sus archivos; el administrador ve la biblioteca completa.
  const where = {
    ...(user.role === "ADMIN" ? {} : { userId: user.id }),
    ...(q.folder ? { folder: q.folder } : {}),
    ...(q.q ? { name: { contains: q.q } } : {}),
  };
  const [items, total] = await Promise.all([
    db.media.findMany({ where, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.media.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export async function deleteMedia(id: string, user: SessionUser) {
  const m = await db.media.findUnique({ where: { id } });
  if (!m) throw notFound("Archivo no encontrado");
  if (user.role !== "ADMIN" && m.userId !== user.id) throw forbidden();
  if (await isReferenced(m.url)) throw badRequest("El archivo está en uso por una propiedad, proyecto, artículo, ciudad o perfil");
  await storage.remove(m.url);
  await db.media.delete({ where: { id } });
}

/** ¿Alguna entidad sigue usando esta URL? */
async function isReferenced(url: string) {
  const counts = await Promise.all([
    db.propertyImage.count({ where: { url } }),
    db.projectImage.count({ where: { url } }),
    db.post.count({ where: { OR: [{ coverUrl: url }, { content: { contains: url } }] } }),
    db.page.count({ where: { content: { contains: url } } }),
    db.property.count({ where: { content: { contains: url } } }),
    db.project.count({ where: { content: { contains: url } } }),
    db.city.count({ where: { imageUrl: url } }),
    db.user.count({ where: { avatarUrl: url } }),
    db.investor.count({ where: { logoUrl: url } }),
    db.careerApplication.count({ where: { resumeUrl: url } }),
    // Logo, portada y demás imágenes configuradas en Apariencia.
    db.setting.count({ where: { value: url } }),
  ]);
  return counts.some((n) => n > 0);
}

/**
 * Borra del disco los archivos subidos que ya no usa ninguna entidad.
 * Solo toca rutas /uploads/ y nunca falla la operación principal.
 */
export async function cleanupUploads(urls: string[]) {
  const unique = [...new Set(urls.filter((u) => u.startsWith("/uploads/")))];
  for (const url of unique) {
    try {
      if (await isReferenced(url)) continue;
      await storage.remove(url);
      await db.media.deleteMany({ where: { url } });
    } catch {
      /* se ignora: es limpieza de mejor esfuerzo */
    }
  }
}

export const mediaFolders = async () => {
  const rows = await db.media.groupBy({ by: ["folder"], _count: true });
  return rows.map((r) => ({ folder: r.folder, count: r._count }));
};
