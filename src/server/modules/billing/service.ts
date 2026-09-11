import { z } from "zod";
import { db } from "@/server/db";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { getSettings } from "@/server/modules/settings/service";
import { adjustCredits } from "@/server/modules/users/service";
import { COUPON_TYPES, INVOICE_STATUSES } from "@/lib/constants";
import type { SessionUser } from "@/server/auth/guards";

// ── Paquetes ──
export const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  currencyCode: z.string().length(3).default("USD"),
  credits: z.coerce.number().int().min(1),
  durationDays: z.coerce.number().int().min(1).default(30),
  isFeaturedListing: z.coerce.boolean().default(false),
  isPopular: z.coerce.boolean().default(false),
  order: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});
export const listPackages = (onlyActive = true) => db.package.findMany({ where: onlyActive ? { isActive: true } : {}, orderBy: { order: "asc" } });
export const createPackage = (input: z.infer<typeof packageSchema>) => db.package.create({ data: input });
export const updatePackage = (id: string, input: Partial<z.infer<typeof packageSchema>>) => db.package.update({ where: { id }, data: input });
export const deletePackage = (id: string) => db.package.delete({ where: { id } });

// ── Cupones ──
export const couponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  type: z.enum(COUPON_TYPES).default("PERCENT"),
  value: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});
export const listCoupons = () => db.coupon.findMany({ orderBy: { code: "asc" } });
export const createCoupon = (input: z.infer<typeof couponSchema>) => db.coupon.create({ data: input });
export const updateCoupon = (id: string, input: Partial<z.infer<typeof couponSchema>>) => db.coupon.update({ where: { id }, data: input });
export const deleteCoupon = (id: string) => db.coupon.delete({ where: { id } });

export async function validateCoupon(code: string) {
  const c = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c || !c.isActive) throw badRequest("Cupón inválido");
  if (c.expiresAt && c.expiresAt < new Date()) throw badRequest("El cupón expiró");
  if (c.maxUses && c.usedCount >= c.maxUses) throw badRequest("El cupón alcanzó su límite de usos");
  return c;
}

/** Cálculo puro de totales de una factura. */
export function computeTotals(price: number, coupon: { type: string; value: number } | null, taxPercent: number) {
  const discount = !coupon ? 0 : coupon.type === "PERCENT" ? Math.round(price * coupon.value) / 100 : Math.min(price, coupon.value);
  const base = Math.max(0, price - discount);
  const tax = Math.round(base * taxPercent) / 100;
  return { subtotal: price, discount, tax, total: Math.round((base + tax) * 100) / 100 };
}

// ── Facturas ──
export const checkoutSchema = z.object({ packageId: z.string(), coupon: z.string().optional().nullable(), gateway: z.enum(["SANDBOX", "MANUAL", "STRIPE"]).optional() });
export const invoiceQuerySchema = paginationSchema.extend({ status: z.enum(INVOICE_STATUSES).optional(), scope: z.enum(["admin", "mine"]).default("mine"), q: z.string().optional() });

async function nextInvoiceNumber(prefix: string) {
  const year = new Date().getFullYear();
  const count = await db.invoice.count();
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function checkout(input: z.infer<typeof checkoutSchema>, user: SessionUser) {
  const pkg = await db.package.findUnique({ where: { id: input.packageId } });
  if (!pkg || !pkg.isActive) throw notFound("Paquete no disponible");
  const settings = await getSettings();
  const coupon = input.coupon ? await validateCoupon(input.coupon) : null;
  const totals = computeTotals(pkg.price, coupon, Number(settings.tax_percent ?? 0));
  const invoice = await db.invoice.create({
    data: {
      number: await nextInvoiceNumber(settings.invoice_prefix || "HB"),
      userId: user.id,
      packageId: pkg.id,
      couponId: coupon?.id ?? null,
      currencyCode: pkg.currencyCode,
      ...totals,
    },
  });
  if (coupon) await db.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });

  const gateway = input.gateway ?? (process.env.PAYMENT_GATEWAY as "SANDBOX" | "MANUAL" | "STRIPE" | undefined) ?? "SANDBOX";
  if (gateway === "SANDBOX" || totals.total === 0) {
    await markPaid(invoice.id, { gateway: "SANDBOX", reference: `sbx_${Date.now()}` });
  } else {
    await db.payment.create({ data: { invoiceId: invoice.id, gateway, amount: totals.total, status: "PENDING" } });
  }
  return getInvoice(invoice.id, user);
}

/** Marca pagada y acredita los créditos del paquete (idempotente). */
export async function markPaid(invoiceId: string, payment: { gateway: string; reference?: string }) {
  const inv = await db.invoice.findUnique({ where: { id: invoiceId }, include: { package: true } });
  if (!inv) throw notFound("Factura no encontrada");
  if (inv.status === "PAID") return inv;
  await db.$transaction([
    db.invoice.update({ where: { id: invoiceId }, data: { status: "PAID", paidAt: new Date() } }),
    db.payment.create({ data: { invoiceId, gateway: payment.gateway, reference: payment.reference, amount: inv.total, status: "COMPLETED" } }),
  ]);
  if (inv.package) await adjustCredits(inv.userId, inv.package.credits, "PACKAGE_PURCHASE", inv.number);
  return db.invoice.findUnique({ where: { id: invoiceId } });
}

export async function updateInvoiceStatus(id: string, status: string) {
  if (status === "PAID") return markPaid(id, { gateway: "MANUAL", reference: "admin" });
  return db.invoice.update({ where: { id }, data: { status } });
}

export async function listInvoices(q: z.infer<typeof invoiceQuerySchema>, user: SessionUser) {
  const where = {
    ...(q.scope === "mine" || user.role !== "ADMIN" ? { userId: user.id } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.q ? { OR: [{ number: { contains: q.q } }, { user: { name: { contains: q.q } } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.invoice.findMany({ where, include: { package: true, user: { select: { name: true, email: true } }, payments: true }, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.invoice.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export async function getInvoice(id: string, user: SessionUser) {
  const inv = await db.invoice.findUnique({ where: { id }, include: { package: true, user: true, payments: true, coupon: true } });
  if (!inv) throw notFound("Factura no encontrada");
  if (user.role !== "ADMIN" && inv.userId !== user.id) throw forbidden();
  return inv;
}

export const creditHistory = (userId: string) => db.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
