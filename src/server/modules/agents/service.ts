import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { propertyCardInclude, publicWhere } from "@/server/modules/properties/service";

export const agentQuerySchema = paginationSchema.extend({ q: z.string().optional(), city: z.string().optional() });

export const agentInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isActive: true } },
  city: { include: { state: true } },
  _count: { select: { properties: { where: publicWhere() } } },
} satisfies Prisma.AgentInclude;
export type AgentCard = Prisma.AgentGetPayload<{ include: typeof agentInclude }>;

export async function listAgents(q: z.infer<typeof agentQuerySchema>) {
  const where: Prisma.AgentWhereInput = {
    user: { isActive: true },
    ...(q.q ? { OR: [{ user: { name: { contains: q.q } } }, { agency: { contains: q.q } }] } : {}),
    ...(q.city ? { city: { OR: [{ slug: q.city }, { id: q.city }] } } : {}),
  };
  const [items, total] = await Promise.all([
    db.agent.findMany({ where, include: agentInclude, orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }], ...paginate(q) }),
    db.agent.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export const featuredAgents = (take = 4) => db.agent.findMany({ where: { user: { isActive: true } }, include: agentInclude, orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }], take });

export async function getAgentBySlug(slug: string) {
  const a = await db.agent.findUnique({
    where: { slug },
    include: { ...agentInclude, properties: { where: publicWhere(), include: propertyCardInclude, orderBy: { createdAt: "desc" }, take: 12 } },
  });
  if (!a) throw notFound("Agente no encontrado");
  return a;
}

export const listAgentOptions = () => db.agent.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } });
