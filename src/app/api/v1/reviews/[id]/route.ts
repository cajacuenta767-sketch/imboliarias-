import { z } from "zod";
import { handler, ok, parseBody, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { deleteReview, updateReviewStatus } from "@/server/modules/reviews/service";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await routeParams(ctx);
  const { status } = await parseBody(req, z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }));
  return ok(await updateReviewStatus(id, status));
});
export const DELETE = handler(async (_req, ctx: Ctx) => {
  await requireAdmin();
  await deleteReview((await routeParams(ctx)).id);
  return ok({ deleted: true });
});
