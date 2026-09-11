import { z } from "zod";
import { handler, ok, parseBody } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { getSettings, updateSettings } from "@/server/modules/settings/service";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await getSettings());
});
export const PUT = handler(async (req) => {
  await requireAdmin();
  return ok(await updateSettings(await parseBody(req, z.record(z.string(), z.string()))));
});
