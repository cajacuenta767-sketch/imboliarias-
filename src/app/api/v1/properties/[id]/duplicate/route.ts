import { created, handler, routeParams } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { duplicateProperty } from "@/server/modules/properties/service";

export const POST = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await routeParams(ctx);
  return created(await duplicateProperty(id, user));
});
