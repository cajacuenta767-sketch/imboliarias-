import { handler, ok, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { itemRoute } from "@/server/lib/crud-route";
import { adminUpdateUser, deleteUser, getUser, userAdminSchema } from "@/server/modules/users/service";

const base = itemRoute({ get: getUser, update: adminUpdateUser, remove: deleteUser, schema: userAdminSchema.partial() });
export const GET = base.GET;
export const PUT = base.PUT;

export const DELETE = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await routeParams(ctx);
  await deleteUser(id, admin.id);
  return ok({ deleted: true });
});
