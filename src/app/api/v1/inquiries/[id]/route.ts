import { z } from "zod";
import { handler, ok, parseBody, routeParams } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { forbidden } from "@/server/errors";
import { db } from "@/server/db";
import { deleteInquiry, updateInquiryStatus } from "@/server/modules/inquiries/service";
import { INQUIRY_STATUSES } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };
async function guard(id: string) {
  const user = await requireUser();
  const inq = await db.inquiry.findUnique({ where: { id } });
  if (!inq) throw forbidden();
  if (user.role !== "ADMIN" && inq.ownerId !== user.id) throw forbidden();
}
export const PATCH = handler(async (req, ctx: Ctx) => {
  const { id } = await routeParams(ctx);
  await guard(id);
  const { status } = await parseBody(req, z.object({ status: z.enum(INQUIRY_STATUSES) }));
  return ok(await updateInquiryStatus(id, status));
});
export const DELETE = handler(async (_req, ctx: Ctx) => {
  const { id } = await routeParams(ctx);
  await guard(id);
  await deleteInquiry(id);
  return ok({ deleted: true });
});
