import { z } from "zod";
import { db } from "@/server/db";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { getSettings } from "@/server/modules/settings/service";
import { COUPON_TYPES, INVOICE_STATUSES } from "@/lib/constants";
import type { SessionUser } from "@/server/auth/guards";
import { optionalDate, settingNumber } from "@/server/lib/query";

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
const couponBase = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  type: z.enum(COUPON_TYPES).default("PERCENT"),
  value: z.coerce.number().positive(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  minAmount: z.coerce.number().nonnegative().default(0),
  currencyCode: z.string().length(3).toUpperCase().default("USD"),
  expiresAt: optionalDate(),
  isActive: z.coerce.boolean().default(true),
});
const percentRule = { check: (c: { type?: string; value?: number }) => c.type !== "PERCENT" || c.value === undefined || c.value <= 100, message: "Un cupón porcentual no puede superar el 100 %" };
export const couponSchema = couponBase.refine(percentRule.check, { message: percentRule.message, path: ["value"] });
/** Para actualizaciones parciales (PATCH/PUT desde el panel). */
export const couponPatchSchema = couponBase.partial().refine(percentRule.check, { message: percentRule.message, path: ["value"] });
export const listCoupons = () => db.coupon.findMany({ orderBy: { code: "asc" } });
export const createCoupon = (input: z.infer<typeof couponSchema>) => db.coupon.create({ data: input });
export const updateCoupon = (id: string, input: z.infer<typeof couponPatchSchema>) => db.coupon.update({ where: { id }, data: input });
export const deleteCoupon = (id: string) => db.coupon.delete({ where: { id } });

export async function validateCoupon(code: string, pkg?: { price: number; currencyCode: string }) {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.isActive) throw badRequest("Cupón inválido");
  if (c.expiresAt && c.expiresAt < new Date()) throw badRequest("El cupón expiró");
  if (c.maxUses && c.usedCount >= c.maxUses) throw badRequest("El cupón alcanzó su límite de usos");
  if (pkg) {
    // Un descuento fijo solo tiene sentido en la moneda para la que se creó.
    if (c.type === "FIXED" && c.currencyCode !== pkg.currencyCode) throw badRequest(`Este cupón aplica solo a paquetes en ${c.currencyCode}`);
    if (c.minAmount > 0 && pkg.price < c.minAmount) throw badRequest(`El cupón requiere una compra mínima de ${c.minAmount} ${c.currencyCode}`);
  }
  return c;
}

/** Cálculo puro de totales de una factura. */
export function computeTotals(price: number, coupon: { type: string; value: number } | null, taxPercent: number, decimals = 2) {
  const f = 10 ** Math.max(0, Math.min(4, decimals));
  const r = (n: number) => Math.round(n * f) / f;
  const discount = !coupon ? 0 : coupon.type === "PERCENT" ? r((price * coupon.value) / 100) : Math.min(price, coupon.value);
  const base = Math.max(0, price - discount);
  const tax = r((base * taxPercent) / 100);
  return { subtotal: price, discount, tax, total: r(base + tax) };
}

// ── Facturas ──
export const checkoutSchema = z.object({ packageId: z.string(), coupon: z.string().optional().nullable() });

export type Gateway = "SANDBOX" | "MANUAL";

/** La pasarela la decide el servidor (PAYMENT_GATEWAY); nunca el cliente. STRIPE aún no está integrado, así que cae a MANUAL. */
export function resolveGateway(env = process.env.PAYMENT_GATEWAY): Gateway {
  return env === "SANDBOX" ? "SANDBOX" : "MANUAL";
}

const invoiceUserSelect = { id: true, name: true, email: true, phone: true } as const;
export const invoiceQuerySchema = paginationSchema.extend({ status: z.enum(INVOICE_STATUSES).optional(), scope: z.enum(["admin", "mine"]).default("mine"), q: z.string().optional() });

/** Siguiente número consecutivo por prefijo y año (HB-2026-0007). */
export async function nextInvoiceNumber(prefix: string, offset = 0) {
  const year = new Date().getFullYear();
  const head = `${prefix}-${year}-`;
  // La última factura creada del año lleva el mayor consecutivo (no se ordena por texto para no romper al pasar de 9999).
  const last = await db.invoice.findFirst({ where: { number: { startsWith: head } }, orderBy: { createdAt: "desc" }, select: { number: true } });
  const seq = last ? Number(last.number.slice(head.length)) || 0 : 0;
  return `${head}${String(seq + 1 + offset).padStart(4, "0")}`;
}

const isUniqueViolation = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

export async function checkout(input: z.infer<typeof checkoutSchema>, user: SessionUser) {
  const pkg = await db.package.findUnique({ where: { id: input.packageId } });
  if (!pkg || !pkg.isActive) throw notFound("Paquete no disponible");
  const settings = await getSettings();
  const coupon = input.coupon ? await validateCoupon(input.coupon, pkg) : null;
  const currency = await db.currency.findUnique({ where: { code: pkg.currencyCode }, select: { decimals: true } });
  const taxPercent = settingNumber(settings.tax_percent, 0);
  const totals = computeTotals(pkg.price, coupon, taxPercent, currency?.decimals ?? 2);
  const prefix = settings.invoice_prefix || "HB";

  // El número es consecutivo: si dos compras coinciden, reintentamos con el siguiente.
  let invoice: { id: string } | null = null;
  for (let attempt = 0; attempt < 5 && !invoice; attempt++) {
    try {
      invoice = await db.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            number: await nextInvoiceNumber(prefix, attempt),
            userId: user.id,
            packageId: pkg.id,
            couponId: coupon?.id ?? null,
            currencyCode: pkg.currencyCode,
            taxPercent,
            ...totals,
          },
        });
        if (coupon) {
          const used = await tx.coupon.updateMany({
            where: { id: coupon.id, isActive: true, ...(coupon.maxUses ? { usedCount: { lt: coupon.maxUses } } : {}) },
            data: { usedCount: { increment: 1 } },
          });
          if (used.count === 0) throw badRequest("El cupón ya no está disponible");
        }
        return inv;
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  if (!invoice) throw badRequest("No se pudo generar la factura, inténtalo de nuevo");

  const gateway = resolveGateway();
  if (gateway === "SANDBOX" || totals.total === 0) {
    await markPaid(invoice.id, { gateway: totals.total === 0 ? "FREE" : "SANDBOX", reference: `sbx_${Date.now()}` });
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
  // updateMany condicional: si dos peticiones concurrentes intentan pagar, solo una acredita.
  const credited = await db.$transaction(async (tx) => {
    const r = await tx.invoice.updateMany({ where: { id: invoiceId, status: { not: "PAID" } }, data: { status: "PAID", paidAt: new Date() } });
    if (r.count === 0) return false;
    await tx.payment.updateMany({ where: { invoiceId, status: "PENDING" }, data: { status: "COMPLETED", reference: payment.reference } });
    await tx.payment.create({ data: { invoiceId, gateway: payment.gateway, reference: payment.reference, amount: inv.total, status: "COMPLETED" } });
    if (inv.package) {
      await tx.user.update({ where: { id: inv.userId }, data: { credits: { increment: inv.package.credits } } });
      await tx.creditTransaction.create({ data: { userId: inv.userId, amount: inv.package.credits, reason: "PACKAGE_PURCHASE", reference: inv.number } });
    }
    return true;
  });
  void credited;
  return db.invoice.findUnique({ where: { id: invoiceId } });
}

export async function updateInvoiceStatus(id: string, status: string) {
  const inv = await db.invoice.findUnique({ where: { id }, include: { package: true } });
  if (!inv) throw notFound("Factura no encontrada");
  if (status === inv.status) return inv;
  if (status === "PAID") return markPaid(id, { gateway: "MANUAL", reference: "admin" });
  if (inv.status === "PAID") {
    // Una factura pagada solo puede reembolsarse; al hacerlo se retiran los créditos otorgados.
    if (status !== "REFUNDED") throw badRequest("Una factura pagada solo puede marcarse como reembolsada");
    await db.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id }, data: { status: "REFUNDED" } });
      await tx.payment.updateMany({ where: { invoiceId: id, status: "COMPLETED" }, data: { status: "REFUNDED" } });
      if (inv.package) {
        // Se retiran los créditos otorgados, sin dejar el saldo en negativo.
        const u = await tx.user.findUnique({ where: { id: inv.userId }, select: { credits: true } });
        const take = Math.min(u?.credits ?? 0, inv.package.credits);
        if (take > 0) {
          await tx.user.update({ where: { id: inv.userId }, data: { credits: { decrement: take } } });
          await tx.creditTransaction.create({ data: { userId: inv.userId, amount: -take, reason: "REFUND", reference: inv.number } });
        }
      }
    });
    return db.invoice.findUnique({ where: { id } });
  }
  if (status === "REFUNDED") throw badRequest("Solo se puede reembolsar una factura pagada");
  return db.invoice.update({ where: { id }, data: { status } });
}

export async function listInvoices(q: z.infer<typeof invoiceQuerySchema>, user: SessionUser) {
  const where = {
    ...(q.scope === "mine" || user.role !== "ADMIN" ? { userId: user.id } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.q ? { OR: [{ number: { contains: q.q } }, { user: { name: { contains: q.q } } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.invoice.findMany({ where, include: { package: true, user: { select: invoiceUserSelect }, payments: true }, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.invoice.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export async function getInvoice(id: string, user: SessionUser) {
  const inv = await db.invoice.findUnique({ where: { id }, include: { package: true, user: { select: invoiceUserSelect }, payments: true, coupon: true } });
  if (!inv) throw notFound("Factura no encontrada");
  if (user.role !== "ADMIN" && inv.userId !== user.id) throw forbidden();
  return inv;
}

export const creditHistory = (userId: string) => db.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
