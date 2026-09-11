import { z } from "zod";
import { handler, ok, parseBody } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "@/server/modules/settings/service";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await getSettings());
});
export const PUT = handler(async (req) => {
  await requireAdmin();
  const values = await parseBody(req, z.record(z.enum(Object.keys(DEFAULT_SETTINGS) as [string, ...string[]]), z.string().max(5000)));
  return ok(await updateSettings(values));
});
