import { created, handler, ok, parseQuery } from "@/server/http";
import { currentUser, requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/lib/rate-limit";
import { badRequest } from "@/server/errors";
import { ANONYMOUS_FOLDER, listMedia, MAX_FILES_PER_REQUEST, mediaQuerySchema, uploadMedia } from "@/server/modules/media/service";

export const GET = handler(async (req) => {
  const user = await requireUser();
  const { items, meta } = await listMedia(parseQuery(req, mediaQuerySchema), user);
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  const form = await req.formData();
  const folder = String(form.get("folder") ?? "general");
  // Un visitante puede adjuntar su hoja de vida (PDF) sin sesión; todo lo demás requiere usuario.
  const user = folder === ANONYMOUS_FOLDER ? await currentUser() : await requireUser();
  if (!user) rateLimit(req, "upload-anon", 5, 60 * 60_000);
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) throw badRequest("No se recibió ningún archivo");
  if (files.length > MAX_FILES_PER_REQUEST) throw badRequest(`Máximo ${MAX_FILES_PER_REQUEST} archivos por subida`);
  const saved: Awaited<ReturnType<typeof uploadMedia>>[] = [];
  for (const f of files) saved.push(await uploadMedia(f, folder, user));
  return created(saved);
});
