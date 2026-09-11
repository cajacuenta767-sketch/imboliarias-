import { z } from "zod";
import { handler, ok, parseBody } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "@/server/modules/settings/service";
import { badRequest } from "@/server/errors";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await getSettings());
});
export const PUT = handler(async (req) => {
  await requireAdmin();
  const raw = await parseBody(req, z.record(z.string(), z.string().max(5000)));
  // Solo claves conocidas; el formulario envía un subconjunto (la sección visible), nunca todas.
  const values = Object.fromEntries(Object.entries(raw).filter(([k]) => k in DEFAULT_SETTINGS));
  if (Object.keys(values).length === 0) throw badRequest("No hay ajustes válidos que guardar");
  return ok(await updateSettings(values));
});
