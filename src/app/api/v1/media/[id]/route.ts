import { handler, ok, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { deleteMedia } from "@/server/modules/media/service";

export const DELETE = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  await deleteMedia((await routeParams(ctx)).id);
  return ok({ deleted: true });
});
