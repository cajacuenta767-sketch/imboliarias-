import { handler, ok, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { deleteCurrency } from "@/server/modules/currencies/service";

export const DELETE = handler(async (_req, ctx: { params: Promise<{ code: string }> }) => {
  await requireAdmin();
  await deleteCurrency((await routeParams(ctx)).code);
  return ok({ deleted: true });
});
