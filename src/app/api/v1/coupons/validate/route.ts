import { z } from "zod";
import { handler, ok, parseBody } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { computeTotals, validateCoupon } from "@/server/modules/billing/service";
import { getSettings } from "@/server/modules/settings/service";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { rateLimit } from "@/server/lib/rate-limit";
import { settingNumber } from "@/server/lib/query";

export const POST = handler(async (req) => {
  rateLimit(req, "coupon", 20);
  await requireUser();
  const { code, packageId } = await parseBody(req, z.object({ code: z.string(), packageId: z.string() }));
  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) throw notFound("Paquete no encontrado");
  const coupon = await validateCoupon(code, pkg);
  const [settings, currency] = await Promise.all([getSettings(), db.currency.findUnique({ where: { code: pkg.currencyCode }, select: { decimals: true } })]);
  return ok({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, totals: computeTotals(pkg.price, coupon, settingNumber(settings.tax_percent, 0), currency?.decimals ?? 2) });
});
