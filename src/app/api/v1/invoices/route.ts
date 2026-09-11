import { handler, ok, parseQuery } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { invoiceQuerySchema, listInvoices } from "@/server/modules/billing/service";

export const GET = handler(async (req) => {
  const user = await requireUser();
  const { items, meta } = await listInvoices(parseQuery(req, invoiceQuerySchema), user);
  return ok(items, meta);
});
