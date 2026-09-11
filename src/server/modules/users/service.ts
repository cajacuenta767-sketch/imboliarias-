import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { conflict, notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { uniqueSlug } from "@/server/lib/slug";
import { getSettings } from "@/server/modules/settings/service";
import { ROLES } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional(),
  asAgent: z.coerce.boolean().default(false),
});

export const userAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(ROLES).default("CUSTOMER"),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
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
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  password: z.string().min(6).optional().or(z.literal("")),
  agent: agentProfileSchema.optional(),
});

export const userQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  role: z.enum(ROLES).optional(),
});

export async function register(input: z.infer<typeof registerSchema>) {
  const email = input.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw conflict("Ya existe una cuenta con ese correo");
  const settings = await getSettings();
  const credits = Number(settings.free_credits_on_signup ?? 0);
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
    await db.creditTransaction.create({ data: { userId: user.id, amount: credits, reason: "ADMIN_ADJUST", reference: "Bienvenida" } });
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
  const u = await db.user.findUnique({ where: { id }, include: { agent: { include: { city: true } } } });
  if (!u) throw notFound("Usuario no encontrado");
  return u;
}

export async function adminCreateUser(input: z.infer<typeof userAdminSchema>) {
  const email = input.email.toLowerCase();
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
      passwordHash: await hashPassword(input.password || "Habitta123!"),
    },
  });
  if (input.role === "AGENT") await ensureAgentProfile(user.id, user.name);
  return user;
}

export async function adminUpdateUser(id: string, input: Partial<z.infer<typeof userAdminSchema>>) {
  const data: Record<string, unknown> = { ...input };
  delete data.password;
  if (input.email) data.email = input.email.toLowerCase();
  if (input.password) data.passwordHash = await hashPassword(input.password);
  const user = await db.user.update({ where: { id }, data });
  if (user.role === "AGENT") await ensureAgentProfile(user.id, user.name);
  return user;
}

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const data: Record<string, unknown> = { name: input.name, phone: input.phone, avatarUrl: input.avatarUrl };
  if (input.password) data.passwordHash = await hashPassword(input.password);
  const user = await db.user.update({ where: { id: userId }, data });
  if (input.agent && (user.role === "AGENT" || user.role === "ADMIN")) {
    const agent = await ensureAgentProfile(user.id, user.name);
    await db.agent.update({ where: { id: agent.id }, data: input.agent });
  }
  return getUser(userId);
}

export const deleteUser = (id: string) => db.user.delete({ where: { id } });

export async function adjustCredits(userId: string, amount: number, reason: string, reference?: string) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { credits: { increment: amount } } }),
    db.creditTransaction.create({ data: { userId, amount, reason, reference } }),
  ]);
}
