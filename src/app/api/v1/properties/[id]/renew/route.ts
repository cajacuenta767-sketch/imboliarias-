import { handler, ok, routeParams } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { renewProperty } from "@/server/modules/properties/service";

export const POST = handler(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await routeParams(ctx);
  return ok(await renewProperty(id, user));
});
