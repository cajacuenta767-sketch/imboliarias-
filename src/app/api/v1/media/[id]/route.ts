import { handler, ok, routeParams } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { deleteMedia } from "@/server/modules/media/service";

export const DELETE = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  await deleteMedia((await routeParams(ctx)).id, user);
  return ok({ deleted: true });
});
