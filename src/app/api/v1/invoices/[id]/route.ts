import { z } from "zod";
import { handler, ok, parseBody, routeParams } from "@/server/http";
import { requireAdmin, requireUser } from "@/server/auth/guards";
import { getInvoice, updateInvoiceStatus } from "@/server/modules/billing/service";
import { INVOICE_STATUSES } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };
export const GET = handler(async (_req, ctx: Ctx) => {
  const user = await requireUser();
  return ok(await getInvoice((await routeParams(ctx)).id, user));
});
export const PATCH = handler(async (req, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await routeParams(ctx);
  const { status } = await parseBody(req, z.object({ status: z.enum(INVOICE_STATUSES) }));
  return ok(await updateInvoiceStatus(id, status));
});
