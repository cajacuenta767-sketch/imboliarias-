import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { createProject, listProjects, projectInputSchema, projectQuerySchema } from "@/server/modules/projects/service";

export const GET = handler(async (req) => {
  const { items, meta } = await listProjects(parseQuery(req, projectQuerySchema));
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  await requireAdmin();
  return created(await createProject(await parseBody(req, projectInputSchema)));
});
