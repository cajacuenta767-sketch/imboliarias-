import { z } from "zod";
import { handler, ok, parseBody } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { computeTotals, validateCoupon } from "@/server/modules/billing/service";
import { getSettings } from "@/server/modules/settings/service";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";

export const POST = handler(async (req) => {
  await requireUser();
  const { code, packageId } = await parseBody(req, z.object({ code: z.string(), packageId: z.string() }));
  const coupon = await validateCoupon(code);
  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg) throw notFound("Paquete no encontrado");
  const settings = await getSettings();
  return ok({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, totals: computeTotals(pkg.price, coupon, Number(settings.tax_percent ?? 0)) });
});
