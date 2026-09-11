import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { uniqueSlug } from "@/server/lib/slug";
import { PROJECT_STATUSES } from "@/lib/constants";
import { propertyCardInclude } from "@/server/modules/properties/service";

export const projectInputSchema = z.object({
  name: z.string().min(3).max(160),
  description: z.string().max(600).optional().nullable(),
  content: z.string().optional().nullable(),
  status: z.enum(PROJECT_STATUSES).default("SELLING"),
  priceFrom: z.coerce.number().nonnegative().optional().nullable(),
  priceTo: z.coerce.number().nonnegative().optional().nullable(),
  currencyCode: z.string().length(3).default("USD"),
  address: z.string().optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  units: z.coerce.number().int().optional().nullable(),
  floors: z.coerce.number().int().optional().nullable(),
  finishAt: z.coerce.date().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  cityId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  investorId: z.string().optional().nullable(),
  images: z.array(z.object({ url: z.string().min(1), alt: z.string().optional().nullable() })).default([]),
  featureIds: z.array(z.string()).default([]),
  facilities: z.array(z.object({ facilityId: z.string(), distance: z.string().optional().nullable() })).default([]),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const projectQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  featured: z.coerce.boolean().optional(),
  scope: z.enum(["public", "admin"]).default("public"),
});
export type ProjectQuery = z.infer<typeof projectQuerySchema>;

export const projectCardInclude = {
  images: { orderBy: { order: "asc" as const }, take: 3 },
  city: { include: { state: true } },
  category: true,
  investor: true,
  _count: { select: { properties: true, images: true } },
} satisfies Prisma.ProjectInclude;

export const projectFullInclude = {
  images: { orderBy: { order: "asc" as const } },
  city: { include: { state: true } },
  category: true,
  investor: true,
  features: { include: { feature: true } },
  facilities: { include: { facility: true } },
  properties: { where: { moderation: "APPROVED", status: "AVAILABLE" }, include: propertyCardInclude, take: 8 },
  _count: { select: { properties: true, images: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectCard = Prisma.ProjectGetPayload<{ include: typeof projectCardInclude }>;
export type ProjectFull = Prisma.ProjectGetPayload<{ include: typeof projectFullInclude }>;

function where(q: ProjectQuery): Prisma.ProjectWhereInput {
  return {
    ...(q.q ? { OR: [{ name: { contains: q.q } }, { description: { contains: q.q } }] } : {}),
    ...(q.city ? { city: { OR: [{ slug: q.city }, { id: q.city }] } } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.featured ? { isFeatured: true } : {}),
  };
}

export async function listProjects(q: ProjectQuery) {
  const w = where(q);
  const [items, total] = await Promise.all([
    db.project.findMany({ where: w, include: projectCardInclude, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], ...paginate(q) }),
    db.project.count({ where: w }),
  ]);
  return { items, meta: meta(q, total) };
}

export const featuredProjects = (take = 4) => db.project.findMany({ where: { isFeatured: true }, include: projectCardInclude, orderBy: { createdAt: "desc" }, take });

export async function getProjectBySlug(slug: string, countView = false) {
  const p = await db.project.findUnique({ where: { slug }, include: projectFullInclude });
  if (!p) throw notFound("Proyecto no encontrado");
  if (countView) db.project.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => undefined);
  return p;
}

export async function getProjectById(id: string) {
  const p = await db.project.findUnique({ where: { id }, include: projectFullInclude });
  if (!p) throw notFound("Proyecto no encontrado");
  return p;
}

function rel(input: ProjectInput) {
  return {
    images: { create: input.images.map((im, i) => ({ url: im.url, alt: im.alt ?? null, order: i })) },
    features: { create: input.featureIds.map((featureId) => ({ featureId })) },
    facilities: { create: input.facilities.map((f) => ({ facilityId: f.facilityId, distance: f.distance ?? null })) },
  };
}
function scalars(input: ProjectInput) {
  const { images, featureIds, facilities, ...rest } = input;
  void images; void featureIds; void facilities;
  return { ...rest, videoUrl: rest.videoUrl || null, cityId: rest.cityId || null, categoryId: rest.categoryId || null, investorId: rest.investorId || null };
}

export async function createProject(input: ProjectInput) {
  const slug = await uniqueSlug(input.name, async (s) => !!(await db.project.findUnique({ where: { slug: s } })));
  return db.project.create({ data: { ...scalars(input), slug, ...rel(input) }, include: projectFullInclude });
}

export async function updateProject(id: string, input: ProjectInput) {
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) throw notFound();
  let slug = existing.slug;
  if (existing.name !== input.name) slug = await uniqueSlug(input.name, async (s) => !!(await db.project.findFirst({ where: { slug: s, NOT: { id } } })));
  await db.$transaction([
    db.projectImage.deleteMany({ where: { projectId: id } }),
    db.projectFeature.deleteMany({ where: { projectId: id } }),
    db.projectFacility.deleteMany({ where: { projectId: id } }),
    db.project.update({ where: { id }, data: { ...scalars(input), slug, ...rel(input) } }),
  ]);
  return getProjectById(id);
}

export const deleteProject = (id: string) => db.project.delete({ where: { id } });
