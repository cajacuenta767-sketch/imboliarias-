import { created, handler, ok, parseQuery } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { badRequest } from "@/server/errors";
import { listMedia, mediaQuerySchema, uploadMedia } from "@/server/modules/media/service";

export const GET = handler(async (req) => {
  await requireUser();
  const { items, meta } = await listMedia(parseQuery(req, mediaQuerySchema));
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  const user = await requireUser();
  const form = await req.formData();
  const folder = String(form.get("folder") ?? "general");
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) throw badRequest("No se recibió ningún archivo");
  const saved = await Promise.all(files.map((f) => uploadMedia(f, folder, user.id)));
  return created(saved);
});
