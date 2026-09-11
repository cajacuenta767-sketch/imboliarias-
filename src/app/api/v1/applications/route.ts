import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { applicationQuerySchema, applicationSchema, applyToCareer, listApplications } from "@/server/modules/careers/service";

export const GET = handler(async (req) => {
  await requireAdmin();
  const { items, meta } = await listApplications(parseQuery(req, applicationQuerySchema));
  return ok(items, meta);
});
export const POST = handler(async (req) => created(await applyToCareer(await parseBody(req, applicationSchema))));
