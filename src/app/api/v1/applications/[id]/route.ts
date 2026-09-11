import { z } from "zod";
import { handler, ok, parseBody, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { updateApplicationStatus } from "@/server/modules/careers/service";

export const PATCH = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await routeParams(ctx);
  const { status } = await parseBody(req, z.object({ status: z.string() }));
  return ok(await updateApplicationStatus(id, status));
});
