import { z } from "zod";
import { handler, ok, parseBody, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { moderateProperty } from "@/server/modules/properties/service";

export const POST = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await routeParams(ctx);
  const { moderation } = await parseBody(req, z.object({ moderation: z.enum(["APPROVED", "REJECTED", "PENDING"]) }));
  return ok(await moderateProperty(id, moderation));
});
