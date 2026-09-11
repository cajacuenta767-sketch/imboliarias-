import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { adminCreateUser, listUsers, userAdminSchema, userQuerySchema } from "@/server/modules/users/service";

export const GET = handler(async (req) => {
  await requireAdmin();
  const { items, meta } = await listUsers(parseQuery(req, userQuerySchema));
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  await requireAdmin();
  return created(await adminCreateUser(await parseBody(req, userAdminSchema)));
});
