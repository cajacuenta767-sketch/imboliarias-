import { handler, ok, parseBody } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { currencySchema, listCurrencies, upsertCurrency } from "@/server/modules/currencies/service";

export const GET = handler(async (req) => ok(await listCurrencies(new URL(req.url).searchParams.get("all") !== "1")));
export const PUT = handler(async (req) => {
  await requireAdmin();
  return ok(await upsertCurrency(await parseBody(req, currencySchema)));
});
