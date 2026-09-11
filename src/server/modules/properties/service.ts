import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { paginate, meta } from "@/server/lib/pagination";
import { uniqueSlug, uniqueCode } from "@/server/lib/slug";
import { getSettings } from "@/server/modules/settings/service";
import { adjustCredits } from "@/server/modules/users/service";
import type { SessionUser } from "@/server/auth/guards";
import type { PropertyInput, PropertyQuery } from "./schema";

export const propertyCardInclude = {
  images: { orderBy: { order: "asc" as const }, take: 4 },
  city: { include: { state: true } },
  category: true,
  agent: { include: { user: { select: { name: true, avatarUrl: true } } } },
  _count: { select: { images: true, reviews: true } },
} satisfies Prisma.PropertyInclude;

export const propertyFullInclude = {
  images: { orderBy: { order: "asc" as const } },
  city: { include: { state: { include: { country: true } } } },
  category: true,
  project: { select: { id: true, name: true, slug: true } },
  agent: { include: { user: { select: { id: true, name: true, avatarUrl: true, email: true, phone: true } }, city: true } },
  author: { select: { id: true, name: true, avatarUrl: true, phone: true, email: true } },
  features: { include: { feature: true } },
  facilities: { include: { facility: true } },
  customValues: { include: { field: true } },
  translations: true,
  reviews: { where: { status: "APPROVED" }, orderBy: { createdAt: "desc" as const } },
  _count: { select: { images: true, reviews: true, wishlist: true } },
} satisfies Prisma.PropertyInclude;

export type PropertyCard = Prisma.PropertyGetPayload<{ include: typeof propertyCardInclude }>;
export type PropertyFull = Prisma.PropertyGetPayload<{ include: typeof propertyFullInclude }>;

function buildWhere(q: PropertyQuery, user?: SessionUser | null): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [];
  if (q.scope === "public") {
    and.push({ moderation: "APPROVED", status: q.status ?? "AVAILABLE" });
    and.push({ OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] });
  } else if (q.scope === "mine") {
    if (!user) throw forbidden();
    and.push({ authorId: user.id });
    if (q.status) and.push({ status: q.status });
    if (q.moderation) and.push({ moderation: q.moderation });
  } else {
    if (q.status) and.push({ status: q.status });
    if (q.moderation) and.push({ moderation: q.moderation });
    if (q.authorId) and.push({ authorId: q.authorId });
  }
  if (q.q) and.push({ OR: [{ title: { contains: q.q } }, { description: { contains: q.q } }, { address: { contains: q.q } }, { uniqueId: { contains: q.q } }] });
  if (q.type) and.push({ type: q.type });
  if (q.city) and.push({ city: { OR: [{ slug: q.city }, { id: q.city }] } });
  if (q.category) and.push({ category: { OR: [{ slug: q.category }, { id: q.category }] } });
  if (q.minPrice !== undefined) and.push({ price: { gte: q.minPrice } });
  if (q.maxPrice !== undefined) and.push({ price: { lte: q.maxPrice } });
  if (q.minArea !== undefined) and.push({ area: { gte: q.minArea } });
  if (q.maxArea !== undefined) and.push({ area: { lte: q.maxArea } });
  if (q.bedrooms !== undefined) and.push({ bedrooms: { gte: q.bedrooms } });
  if (q.bathrooms !== undefined) and.push({ bathrooms: { gte: q.bathrooms } });
  if (q.features?.length) and.push({ AND: q.features.map((featureId) => ({ features: { some: { featureId } } })) });
  if (q.featured) and.push({ isFeatured: true });
  if (q.agent) and.push({ agent: { OR: [{ slug: q.agent }, { id: q.agent }] } });
  if (q.project) and.push({ project: { OR: [{ slug: q.project }, { id: q.project }] } });
  if (q.bbox) {
    const [s, w, n, e] = q.bbox.split(",").map(Number);
    if ([s, w, n, e].every((v) => Number.isFinite(v))) and.push({ lat: { gte: s, lte: n }, lng: { gte: w, lte: e } });
  }
  return { AND: and };
}

const ORDER: Record<PropertyQuery["sort"], Prisma.PropertyOrderByWithRelationInput[]> = {
  newest: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  price_asc: [{ price: "asc" }],
  price_desc: [{ price: "desc" }],
  area_desc: [{ area: "desc" }],
  views: [{ views: "desc" }],
};

export async function listProperties(q: PropertyQuery, user?: SessionUser | null) {
  const where = buildWhere(q, user);
  const [items, total] = await Promise.all([
    db.property.findMany({ where, include: propertyCardInclude, orderBy: ORDER[q.sort], ...paginate(q) }),
    db.property.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

/** Puntos ligeros para el mapa (sin paginar). */
export async function mapPoints(q: PropertyQuery) {
  const where = buildWhere({ ...q, scope: "public" });
  return db.property.findMany({
    where: { ...where, lat: { not: null }, lng: { not: null } },
    select: { id: true, slug: true, title: true, price: true, currencyCode: true, type: true, period: true, lat: true, lng: true, bedrooms: true, bathrooms: true, area: true, images: { take: 1, orderBy: { order: "asc" } }, city: { select: { name: true } } },
    take: 500,
  });
}

export async function getPropertyBySlug(slug: string, opts?: { countView?: boolean; user?: SessionUser | null }) {
  const p = await db.property.findUnique({ where: { slug }, include: propertyFullInclude });
  if (!p) throw notFound("Propiedad no encontrada");
  const isOwnerOrAdmin = opts?.user && (opts.user.role === "ADMIN" || opts.user.id === p.authorId);
  if (!isOwnerOrAdmin && (p.moderation !== "APPROVED" || p.status === "HIDDEN")) throw notFound("Propiedad no disponible");
  if (opts?.countView) db.property.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => undefined);
  return p;
}

export async function getPropertyById(id: string) {
  const p = await db.property.findUnique({ where: { id }, include: propertyFullInclude });
  if (!p) throw notFound("Propiedad no encontrada");
  return p;
}

export async function similarProperties(p: { id: string; cityId: string | null; type: string; categoryId: string | null }, take = 4) {
  return db.property.findMany({
    where: { id: { not: p.id }, moderation: "APPROVED", status: "AVAILABLE", type: p.type, OR: [{ cityId: p.cityId ?? undefined }, { categoryId: p.categoryId ?? undefined }] },
    include: propertyCardInclude,
    orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
    take,
  });
}

export const featuredProperties = (take = 8) =>
  db.property.findMany({ where: { moderation: "APPROVED", status: "AVAILABLE", isFeatured: true }, include: propertyCardInclude, orderBy: { createdAt: "desc" }, take });

export const latestProperties = (type?: "SALE" | "RENT", take = 8) =>
  db.property.findMany({ where: { moderation: "APPROVED", status: "AVAILABLE", ...(type ? { type } : {}) }, include: propertyCardInclude, orderBy: { createdAt: "desc" }, take });

function relationsData(input: PropertyInput) {
  return {
    images: { create: input.images.map((im, i) => ({ url: im.url, alt: im.alt ?? null, order: i })) },
    features: { create: input.featureIds.map((featureId) => ({ featureId })) },
    facilities: { create: input.facilities.map((f) => ({ facilityId: f.facilityId, distance: f.distance ?? null })) },
    customValues: { create: input.customValues.filter((c) => c.value !== "").map((c) => ({ fieldId: c.fieldId, value: c.value })) },
    translations: { create: input.translations.filter((t) => t.value).map((t) => ({ locale: t.locale, field: t.field, value: t.value })) },
  };
}

function scalarData(input: PropertyInput) {
  const { images, featureIds, facilities, customValues, translations, authorId, ...rest } = input;
  void images; void featureIds; void facilities; void customValues; void translations; void authorId;
  return {
    ...rest,
    videoUrl: rest.videoUrl || null,
    period: rest.type === "RENT" ? (rest.period ?? "MONTH") : null,
    cityId: rest.cityId || null,
    categoryId: rest.categoryId || null,
    projectId: rest.projectId || null,
    agentId: rest.agentId || null,
  };
}

/**
 * Crea una propiedad. Si el usuario no es admin, se cobra créditos y se pone en moderación.
 */
export async function createProperty(input: PropertyInput, user: SessionUser) {
  const settings = await getSettings();
  const isAdmin = user.role === "ADMIN";
  const authorId = isAdmin && input.authorId ? input.authorId : user.id;
  const author = await db.user.findUnique({ where: { id: authorId }, include: { agent: true } });
  if (!author) throw notFound("Autor no encontrado");

  const perListing = Number(settings.credits_per_listing ?? 1);
  const perFeatured = Number(settings.credits_per_featured ?? 2);
  const cost = isAdmin ? 0 : perListing + (input.isFeatured ? perFeatured : 0);
  if (!isAdmin && author.credits < cost) throw badRequest(`Necesitas ${cost} crédito(s) para publicar. Tienes ${author.credits}.`);

  const slug = await uniqueSlug(input.title, async (s) => !!(await db.property.findUnique({ where: { slug: s } })));
  const days = Number(settings.listing_days ?? 45);
  const moderation = isAdmin ? (input.moderation ?? "APPROVED") : settings.moderation_required === "true" ? "PENDING" : "APPROVED";

  const property = await db.property.create({
    data: {
      ...scalarData(input),
      slug,
      uniqueId: uniqueCode(settings.invoice_prefix || "HB"),
      moderation,
      authorId,
      agentId: input.agentId || author.agent?.id || null,
      expiresAt: input.expiresAt ?? new Date(Date.now() + days * 86400000),
      publishedAt: moderation === "APPROVED" ? new Date() : null,
      ...relationsData(input),
    },
    include: propertyFullInclude,
  });
  if (cost > 0) await adjustCredits(authorId, -cost, "PROPERTY_PUBLISH", property.uniqueId ?? property.id);
  return property;
}

export async function updateProperty(id: string, input: PropertyInput, user: SessionUser) {
  const existing = await db.property.findUnique({ where: { id } });
  if (!existing) throw notFound("Propiedad no encontrada");
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && existing.authorId !== user.id) throw forbidden();

  const data = scalarData(input);
  if (!isAdmin) {
    delete (data as { moderation?: string }).moderation;
    // si el agente cambia contenido relevante, vuelve a moderación cuando está configurado
    const settings = await getSettings();
    if (settings.moderation_required === "true" && existing.moderation === "APPROVED" && existing.title !== input.title) {
      (data as { moderation?: string }).moderation = "PENDING";
    }
    if (input.isFeatured && !existing.isFeatured) {
      const perFeatured = Number(settings.credits_per_featured ?? 2);
      const author = await db.user.findUnique({ where: { id: user.id } });
      if ((author?.credits ?? 0) < perFeatured) throw badRequest(`Destacar cuesta ${perFeatured} créditos.`);
      await adjustCredits(user.id, -perFeatured, "PROPERTY_PUBLISH", `Destacar ${existing.uniqueId}`);
    }
  }
  let slug = existing.slug;
  if (input.title !== existing.title) {
    slug = await uniqueSlug(input.title, async (s) => !!(await db.property.findFirst({ where: { slug: s, NOT: { id } } })));
  }
  await db.$transaction([
    db.propertyImage.deleteMany({ where: { propertyId: id } }),
    db.propertyFeature.deleteMany({ where: { propertyId: id } }),
    db.propertyFacility.deleteMany({ where: { propertyId: id } }),
    db.customFieldValue.deleteMany({ where: { propertyId: id } }),
    db.translation.deleteMany({ where: { propertyId: id } }),
    db.property.update({ where: { id }, data: { ...data, slug, ...relationsData(input) } }),
  ]);
  return getPropertyById(id);
}

export async function deleteProperty(id: string, user: SessionUser) {
  const existing = await db.property.findUnique({ where: { id } });
  if (!existing) throw notFound();
  if (user.role !== "ADMIN" && existing.authorId !== user.id) throw forbidden();
  await db.property.delete({ where: { id } });
}

export async function duplicateProperty(id: string, user: SessionUser) {
  const p = await getPropertyById(id);
  if (user.role !== "ADMIN" && p.authorId !== user.id) throw forbidden();
  const input: PropertyInput = {
    title: `${p.title} (copia)`,
    description: p.description,
    content: p.content,
    type: p.type as "SALE" | "RENT",
    status: "AVAILABLE",
    price: p.price,
    currencyCode: p.currencyCode,
    period: p.period as PropertyInput["period"],
    area: p.area,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    floors: p.floors,
    parking: p.parking,
    yearBuilt: p.yearBuilt,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    videoUrl: p.videoUrl,
    isFeatured: false,
    cityId: p.cityId,
    categoryId: p.categoryId,
    projectId: p.projectId,
    agentId: p.agentId,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    featureIds: p.features.map((f) => f.featureId),
    facilities: p.facilities.map((f) => ({ facilityId: f.facilityId, distance: f.distance })),
    customValues: p.customValues.map((c) => ({ fieldId: c.fieldId, value: c.value })),
    translations: p.translations.map((t) => ({ locale: t.locale, field: t.field, value: t.value })),
    expiresAt: null,
  };
  return createProperty({ ...input, moderation: "PENDING" }, user);
}

export async function renewProperty(id: string, user: SessionUser) {
  const p = await db.property.findUnique({ where: { id } });
  if (!p) throw notFound();
  if (user.role !== "ADMIN" && p.authorId !== user.id) throw forbidden();
  const settings = await getSettings();
  const cost = user.role === "ADMIN" ? 0 : Number(settings.credits_per_listing ?? 1);
  if (cost > 0) {
    const u = await db.user.findUnique({ where: { id: user.id } });
    if ((u?.credits ?? 0) < cost) throw badRequest(`Renovar cuesta ${cost} crédito(s).`);
    await adjustCredits(user.id, -cost, "PROPERTY_RENEW", p.uniqueId ?? p.id);
  }
  const days = Number(settings.listing_days ?? 45);
  const base = p.expiresAt && p.expiresAt > new Date() ? p.expiresAt : new Date();
  return db.property.update({ where: { id }, data: { expiresAt: new Date(base.getTime() + days * 86400000), status: p.status === "HIDDEN" ? "AVAILABLE" : p.status } });
}

export async function moderateProperty(id: string, moderation: "APPROVED" | "REJECTED" | "PENDING") {
  return db.property.update({ where: { id }, data: { moderation, publishedAt: moderation === "APPROVED" ? new Date() : undefined } });
}

export async function bulkAction(ids: string[], action: string) {
  switch (action) {
    case "approve":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { moderation: "APPROVED", publishedAt: new Date() } });
    case "reject":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { moderation: "REJECTED" } });
    case "feature":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { isFeatured: true } });
    case "unfeature":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { isFeatured: false } });
    case "hide":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { status: "HIDDEN" } });
    case "show":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { status: "AVAILABLE" } });
    case "delete":
      return db.property.deleteMany({ where: { id: { in: ids } } });
    default:
      throw badRequest("Acción no soportada");
  }
}

export async function exportProperties(q: PropertyQuery) {
  const rows = await db.property.findMany({ where: buildWhere({ ...q, scope: "admin" }), include: { city: true, category: true, images: { take: 1, orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" } });
  return rows.map((p) => ({
    uniqueId: p.uniqueId, title: p.title, type: p.type, status: p.status, moderation: p.moderation, price: p.price, currency: p.currencyCode, period: p.period,
    area: p.area, bedrooms: p.bedrooms, bathrooms: p.bathrooms, parking: p.parking, city: p.city?.name, category: p.category?.name, address: p.address, lat: p.lat, lng: p.lng, image: p.images[0]?.url, createdAt: p.createdAt.toISOString(),
  }));
}

export async function importProperties(rows: Record<string, string>[], user: SessionUser) {
  let created = 0;
  const errors: string[] = [];
  for (const [i, r] of rows.entries()) {
    try {
      const city = r.city ? await db.city.findFirst({ where: { OR: [{ name: r.city }, { slug: r.city }] } }) : null;
      const category = r.category ? await db.category.findFirst({ where: { OR: [{ name: r.category }, { slug: r.category }] } }) : null;
      await createProperty(
        {
          title: r.title, description: r.description || null, content: null, type: (r.type?.toUpperCase() === "RENT" ? "RENT" : "SALE"), status: "AVAILABLE",
          price: Number(r.price), currencyCode: r.currency || "USD", period: r.period as PropertyInput["period"], area: r.area ? Number(r.area) : null,
          bedrooms: r.bedrooms ? Number(r.bedrooms) : null, bathrooms: r.bathrooms ? Number(r.bathrooms) : null, floors: null, parking: r.parking ? Number(r.parking) : null, yearBuilt: null,
          address: r.address || null, lat: r.lat ? Number(r.lat) : null, lng: r.lng ? Number(r.lng) : null, videoUrl: null, isFeatured: false,
          cityId: city?.id ?? null, categoryId: category?.id ?? null, projectId: null, agentId: null, images: r.image ? [{ url: r.image }] : [], featureIds: [], facilities: [], customValues: [], translations: [], expiresAt: null,
          moderation: "APPROVED",
        },
        user,
      );
      created++;
    } catch (e) {
      errors.push(`Fila ${i + 2}: ${(e as Error).message}`);
    }
  }
  return { created, errors };
}
