import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { badRequest, conflict, notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { uniqueSlug } from "@/server/lib/slug";
import { getSettings } from "@/server/modules/settings/service";
import { ROLES } from "@/lib/constants";
import { settingNumber } from "@/server/lib/query";
import { cleanText } from "@/server/lib/sanitize";

export const registerSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  phone: z.string().max(40).optional(),
  asAgent: z.coerce.boolean().default(false),
});

export const userAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  role: z.enum(ROLES).default("CUSTOMER"),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().max(500).optional().nullable(),
  credits: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const agentProfileSchema = z.object({
  title: z.string().optional().nullable(),
  agency: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(40).optional().nullable(),
  avatarUrl: z.string().max(500).optional().nullable(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  agent: agentProfileSchema.optional(),
});

/** Campos públicos de un usuario (nunca el hash de contraseña). */
export const safeUserOmit = { passwordHash: true } as const;

export const userQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  role: z.enum(ROLES).optional(),
});

export async function register(input: z.infer<typeof registerSchema>) {
  const email = input.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw conflict("Ya existe una cuenta con ese correo");
  const settings = await getSettings();
  const credits = settingNumber(settings.free_credits_on_signup, 0);
  const user = await db.user.create({
    data: {
      name: input.name,
      email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: input.asAgent ? "AGENT" : "CUSTOMER",
      credits,
    },
  });
  if (input.asAgent) await ensureAgentProfile(user.id, user.name);
  if (credits > 0) {
    await db.creditTransaction.create({ data: { userId: user.id, amount: credits, reason: "SIGNUP_BONUS", reference: "Bienvenida" } });
  }
  return user;
}

export async function ensureAgentProfile(userId: string, name: string) {
  const existing = await db.agent.findUnique({ where: { userId } });
  if (existing) return existing;
  const slug = await uniqueSlug(name, async (s) => !!(await db.agent.findUnique({ where: { slug: s } })));
  return db.agent.create({ data: { userId, slug } });
}

export async function listUsers(query: z.infer<typeof userQuerySchema>) {
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.q ? { OR: [{ name: { contains: query.q } }, { email: { contains: query.q } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      ...paginate(query),
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, credits: true, isActive: true, createdAt: true, _count: { select: { properties: true } } },
    }),
    db.user.count({ where }),
  ]);
  return { items, meta: meta(query, total) };
}

export async function getUser(id: string) {
  const u = await db.user.findUnique({ where: { id }, omit: safeUserOmit, include: { agent: { include: { city: true } } } });
  if (!u) throw notFound("Usuario no encontrado");
  return u;
}

export async function adminCreateUser(input: z.infer<typeof userAdminSchema>) {
  const email = input.email.toLowerCase();
  if (!input.password) throw badRequest("Indica una contraseña para la nueva cuenta", { password: ["Requerida"] });
  if (await db.user.findUnique({ where: { email } })) throw conflict("Correo ya registrado");
  const user = await db.user.create({
    data: {
      name: input.name,
      email,
      role: input.role,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
      credits: input.credits,
      isActive: input.isActive,
      passwordHash: await hashPassword(input.password),
    },
    omit: safeUserOmit,
  });
  if (input.role === "AGENT") await ensureAgentProfile(user.id, user.name);
  return user;
}

export async function adminUpdateUser(id: string, input: Partial<z.infer<typeof userAdminSchema>>) {
  const data: Record<string, unknown> = { ...input };
  delete data.password;
  if (input.email) {
    data.email = input.email.toLowerCase();
    const other = await db.user.findUnique({ where: { email: data.email as string } });
    if (other && other.id !== id) throw conflict("Correo ya registrado");
  }
  if (input.password) data.passwordHash = await hashPassword(input.password);
  const user = await db.$transaction(async (tx) => {
    // Un cambio manual de saldo queda registrado en el historial como ajuste del administrador.
    if (input.credits !== undefined) {
      const current = await tx.user.findUnique({ where: { id }, select: { credits: true } });
      if (!current) throw notFound("Usuario no encontrado");
      const diff = input.credits - current.credits;
      if (diff !== 0) await tx.creditTransaction.create({ data: { userId: id, amount: diff, reason: "ADMIN_ADJUST", reference: "Ajuste manual" } });
    }
    return tx.user.update({ where: { id }, data, omit: safeUserOmit });
  });
  if (user.role === "AGENT") await ensureAgentProfile(user.id, user.name);
  return user;
}

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const data: Record<string, unknown> = { name: input.name, phone: input.phone || null, avatarUrl: input.avatarUrl || null };
  if (input.password) data.passwordHash = await hashPassword(input.password);
  const user = await db.user.update({ where: { id: userId }, data, omit: safeUserOmit });
  if (input.agent && (user.role === "AGENT" || user.role === "ADMIN")) {
    // "Destacado" lo decide el administrador, no el propio agente.
    const { isFeatured, cityId, ...rest } = input.agent;
    void isFeatured;
    const agent = await ensureAgentProfile(user.id, user.name);
    await db.agent.update({ where: { id: agent.id }, data: { ...rest, bio: cleanText(rest.bio), cityId: cityId || null } });
  }
  return getUser(userId);
}

export async function deleteUser(id: string, actingUserId?: string) {
  if (actingUserId && actingUserId === id) throw badRequest("No puedes eliminar tu propia cuenta");
  const [props, invoices] = await Promise.all([db.property.count({ where: { authorId: id } }), db.invoice.count({ where: { userId: id } })]);
  if (props > 0) throw badRequest(`El usuario tiene ${props} propiedad(es). Reasígnalas o elimínalas primero.`);
  if (invoices > 0) throw badRequest(`El usuario tiene ${invoices} factura(s); desactiva la cuenta en lugar de eliminarla.`);
  return db.user.delete({ where: { id }, omit: safeUserOmit });
}

export async function adjustCredits(userId: string, amount: number, reason: string, reference?: string) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { credits: { increment: amount } } }),
    db.creditTransaction.create({ data: { userId, amount, reason, reference } }),
  ]);
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0] extends (tx: infer T) => unknown ? (tx: T) => unknown : never>[0];

/**
 * Descuenta créditos de forma atómica: la actualización solo aplica si el saldo alcanza,
 * así dos publicaciones simultáneas no pueden dejar el saldo negativo.
 */
export async function spendCredits(tx: Tx, userId: string, amount: number, reason: string, reference?: string) {
  if (amount <= 0) return;
  const r = await tx.user.updateMany({ where: { id: userId, credits: { gte: amount } }, data: { credits: { decrement: amount } } });
  if (r.count === 0) {
    const u = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
    throw badRequest(`Necesitas ${amount} crédito(s) para esta acción. Tienes ${u?.credits ?? 0}.`);
  }
  await tx.creditTransaction.create({ data: { userId, amount: -amount, reason, reference } });
}
