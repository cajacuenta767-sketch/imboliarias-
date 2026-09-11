import { handler, ok, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { deletePostCategory } from "@/server/modules/posts/service";

export const DELETE = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  await deletePostCategory((await routeParams(ctx)).id);
  return ok({ deleted: true });
});
