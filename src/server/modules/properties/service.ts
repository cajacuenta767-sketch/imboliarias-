import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { badRequest, forbidden, notFound } from "@/server/errors";
import { paginate, meta } from "@/server/lib/pagination";
import { uniqueSlug, uniqueCode } from "@/server/lib/slug";
import { getSettings } from "@/server/modules/settings/service";
import { cleanupUploads } from "@/server/modules/media/service";
import { settingNumber } from "@/server/lib/query";
import { cleanHtml, cleanText } from "@/server/lib/sanitize";
import { spendCredits } from "@/server/modules/users/service";
import type { SessionUser } from "@/server/auth/guards";
import { propertyInputSchema, type PropertyInput, type PropertyQuery } from "./schema";

/** Condición base de toda consulta pública: aprobada, disponible y no vencida. */
export const publicWhere = (): Prisma.PropertyWhereInput => ({
  moderation: "APPROVED",
  status: "AVAILABLE",
  OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
});

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
  author: { select: { id: true, name: true, avatarUrl: true, phone: true } },
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
    // En público nunca se listan las ocultas, aunque se pida ?status=HIDDEN.
    const status = q.status && q.status !== "HIDDEN" ? q.status : "AVAILABLE";
    and.push({ moderation: "APPROVED", status });
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

// Cada orden termina en `id` para que la paginación sea estable ante empates.
const ORDER: Record<PropertyQuery["sort"], Prisma.PropertyOrderByWithRelationInput[]> = {
  newest: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "asc" }],
  area_desc: [{ area: "desc" }, { id: "asc" }],
  views: [{ views: "desc" }, { id: "asc" }],
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
  const related: Prisma.PropertyWhereInput[] = [];
  if (p.cityId) related.push({ cityId: p.cityId });
  if (p.categoryId) related.push({ categoryId: p.categoryId });
  return db.property.findMany({
    where: { AND: [publicWhere(), { id: { not: p.id }, type: p.type }, ...(related.length ? [{ OR: related }] : [])] },
    include: propertyCardInclude,
    orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
    take,
  });
}

export const featuredProperties = (take = 8) =>
  db.property.findMany({ where: { AND: [publicWhere(), { isFeatured: true }] }, include: propertyCardInclude, orderBy: { createdAt: "desc" }, take });

export const latestProperties = (type?: "SALE" | "RENT", take = 8) =>
  db.property.findMany({ where: { AND: [publicWhere(), type ? { type } : {}] }, include: propertyCardInclude, orderBy: { createdAt: "desc" }, take });

function relationsData(input: PropertyInput) {
  return {
    images: { create: input.images.map((im, i) => ({ url: im.url, alt: im.alt ?? null, order: i })) },
    features: { create: input.featureIds.map((featureId) => ({ featureId })) },
    facilities: { create: input.facilities.map((f) => ({ facilityId: f.facilityId, distance: f.distance ?? null })) },
    customValues: { create: input.customValues.filter((c) => c.value !== "").map((c) => ({ fieldId: c.fieldId, value: c.value })) },
    translations: { create: input.translations.filter((t) => t.value).map((t) => ({ locale: t.locale, field: t.field, value: (t.field === "content" ? cleanHtml(t.value) : cleanText(t.value)) ?? "" })).filter((t) => t.value) },
  };
}

function scalarData(input: PropertyInput) {
  const { images, featureIds, facilities, customValues, translations, authorId, ...rest } = input;
  void images; void featureIds; void facilities; void customValues; void translations; void authorId;
  return {
    ...rest,
    title: rest.title.trim(),
    description: cleanText(rest.description),
    content: cleanHtml(rest.content),
    address: cleanText(rest.address),
    videoUrl: rest.videoUrl || null,
    period: rest.type === "RENT" ? (rest.period ?? "MONTH") : null,
    cityId: rest.cityId || null,
    categoryId: rest.categoryId || null,
    projectId: rest.projectId || null,
    agentId: rest.agentId || null,
  };
}

/** Genera un código público único (HB-123456) reintentando ante colisiones. */
async function freeUniqueCode(prefix: string) {
  for (let i = 0; i < 10; i++) {
    const code = uniqueCode(prefix);
    if (!(await db.property.findUnique({ where: { uniqueId: code }, select: { id: true } }))) return code;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

/** Campos que solo el administrador puede fijar; para el resto se fuerzan valores seguros. */
function restrictForNonAdmin(input: PropertyInput, ownAgentId: string | null): PropertyInput {
  return { ...input, moderation: undefined, expiresAt: undefined, authorId: undefined, agentId: ownAgentId };
}

const CONTENT_FIELDS = ["title", "description", "content", "price", "address"] as const;

/**
 * Crea una propiedad. Si el usuario no es admin, se cobra créditos (de forma atómica) y se pone en moderación.
 */
export async function createProperty(rawInput: PropertyInput, user: SessionUser) {
  const settings = await getSettings();
  const isAdmin = user.role === "ADMIN";
  const authorId = isAdmin && rawInput.authorId ? rawInput.authorId : user.id;
  const author = await db.user.findUnique({ where: { id: authorId }, include: { agent: true } });
  if (!author) throw notFound("Autor no encontrado");
  const input = isAdmin ? rawInput : restrictForNonAdmin(rawInput, author.agent?.id ?? null);

  const perListing = settingNumber(settings.credits_per_listing, 1);
  const perFeatured = settingNumber(settings.credits_per_featured, 2);
  const cost = isAdmin ? 0 : perListing + (input.isFeatured ? perFeatured : 0);
  if (!isAdmin && author.credits < cost) throw badRequest(`Necesitas ${cost} crédito(s) para publicar. Tienes ${author.credits}.`);

  const slug = await uniqueSlug(input.title, async (s) => !!(await db.property.findUnique({ where: { slug: s } })));
  const uniqueId = await freeUniqueCode(settings.invoice_prefix || "HB");
  const days = settingNumber(settings.listing_days, 45);
  const moderation = isAdmin ? (input.moderation ?? "APPROVED") : settings.moderation_required === "true" ? "PENDING" : "APPROVED";

  const created = await db.$transaction(async (tx) => {
    const property = await tx.property.create({
      data: {
        ...scalarData(input),
        slug,
        uniqueId,
        moderation,
        authorId,
        agentId: input.agentId || author.agent?.id || null,
        // El plazo de vigencia empieza a contar cuando la publicación es visible (aprobada).
        expiresAt: (isAdmin && input.expiresAt) || (moderation === "APPROVED" ? new Date(Date.now() + days * 86400000) : null),
        publishedAt: moderation === "APPROVED" ? new Date() : null,
        ...relationsData(input),
      },
      select: { id: true, uniqueId: true },
    });
    if (cost > 0) await spendCredits(tx, authorId, cost, "PROPERTY_PUBLISH", property.uniqueId ?? property.id);
    return property;
  });
  return getPropertyById(created.id);
}

export async function updateProperty(id: string, rawInput: PropertyInput, user: SessionUser) {
  const existing = await db.property.findUnique({ where: { id }, include: { images: { orderBy: { order: "asc" } } } });
  if (!existing) throw notFound("Propiedad no encontrada");
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && existing.authorId !== user.id) throw forbidden();

  let input = rawInput;
  let featuredCost = 0;
  let moderationOverride: string | undefined;
  if (!isAdmin) {
    // El agente no puede tocar moderación, vencimiento ni reasignar la publicación a otro asesor.
    input = restrictForNonAdmin(rawInput, existing.agentId);
    const settings = await getSettings();
    const imagesChanged = existing.images.map((i) => i.url).join("|") !== input.images.map((i) => i.url).join("|");
    const contentChanged = CONTENT_FIELDS.some((f) => (existing[f] ?? null) !== (input[f] ?? null)) || imagesChanged;
    // Si cambia contenido relevante, vuelve a moderación cuando está configurado.
    if (settings.moderation_required === "true" && existing.moderation === "APPROVED" && contentChanged) moderationOverride = "PENDING";
    if (existing.moderation === "REJECTED") moderationOverride = "PENDING";
    if (input.isFeatured && !existing.isFeatured) featuredCost = settingNumber(settings.credits_per_featured, 2);
  }

  const data = scalarData(input);
  if (!isAdmin) {
    delete (data as { moderation?: string }).moderation;
    delete (data as { expiresAt?: Date | null }).expiresAt;
    if (moderationOverride) (data as { moderation?: string }).moderation = moderationOverride;
  } else if (input.expiresAt === undefined) {
    delete (data as { expiresAt?: Date | null }).expiresAt;
  }
  if (isAdmin && input.moderation === "APPROVED" && existing.moderation !== "APPROVED") {
    (data as { publishedAt?: Date }).publishedAt = existing.publishedAt ?? new Date();
    if (!existing.expiresAt || existing.expiresAt < new Date()) (data as { expiresAt?: Date }).expiresAt = new Date(Date.now() + settingNumber((await getSettings()).listing_days, 45) * 86400000);
  }
  const removedImages = existing.images.map((i) => i.url).filter((u) => !input.images.some((im) => im.url === u));

  let slug = existing.slug;
  if (input.title !== existing.title) {
    slug = await uniqueSlug(input.title, async (s) => !!(await db.property.findFirst({ where: { slug: s, NOT: { id } } })));
  }
  await db.$transaction(async (tx) => {
    await tx.propertyImage.deleteMany({ where: { propertyId: id } });
    await tx.propertyFeature.deleteMany({ where: { propertyId: id } });
    await tx.propertyFacility.deleteMany({ where: { propertyId: id } });
    await tx.customFieldValue.deleteMany({ where: { propertyId: id } });
    await tx.translation.deleteMany({ where: { propertyId: id } });
    await tx.property.update({ where: { id }, data: { ...data, slug, ...relationsData(input) } });
    if (featuredCost > 0) await spendCredits(tx, user.id, featuredCost, "PROPERTY_FEATURE", `Destacar ${existing.uniqueId ?? existing.id}`);
  });
  await cleanupUploads(removedImages);
  return getPropertyById(id);
}

export async function deleteProperty(id: string, user: SessionUser) {
  const existing = await db.property.findUnique({ where: { id }, include: { images: true } });
  if (!existing) throw notFound();
  if (user.role !== "ADMIN" && existing.authorId !== user.id) throw forbidden();
  await db.property.delete({ where: { id } });
  await cleanupUploads(existing.images.map((i) => i.url));
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
    // La copia conserva propietario y asesor; el admin la recibe aprobada, el agente pasa por moderación.
    authorId: p.authorId,
    moderation: user.role === "ADMIN" ? "APPROVED" : undefined,
  };
  return createProperty(input, user);
}

export async function renewProperty(id: string, user: SessionUser) {
  const p = await db.property.findUnique({ where: { id } });
  if (!p) throw notFound();
  if (user.role !== "ADMIN" && p.authorId !== user.id) throw forbidden();
  const settings = await getSettings();
  const cost = user.role === "ADMIN" ? 0 : settingNumber(settings.credits_per_listing, 1);
  const days = settingNumber(settings.listing_days, 45);
  const base = p.expiresAt && p.expiresAt > new Date() ? p.expiresAt : new Date();
  return db.$transaction(async (tx) => {
    if (cost > 0) await spendCredits(tx, user.id, cost, "PROPERTY_RENEW", p.uniqueId ?? p.id);
    return tx.property.update({ where: { id }, data: { expiresAt: new Date(base.getTime() + days * 86400000), status: p.status === "HIDDEN" ? "AVAILABLE" : p.status } });
  });
}

/** Al aprobar, la vigencia empieza a contar desde ese momento si no había una vigente. */
async function approvalData(existing: { publishedAt: Date | null; expiresAt: Date | null }) {
  const now = new Date();
  const days = settingNumber((await getSettings()).listing_days, 45);
  return {
    moderation: "APPROVED" as const,
    publishedAt: existing.publishedAt ?? now,
    expiresAt: existing.expiresAt && existing.expiresAt > now ? existing.expiresAt : new Date(now.getTime() + days * 86400000),
  };
}

export async function moderateProperty(id: string, moderation: "APPROVED" | "REJECTED" | "PENDING") {
  const p = await db.property.findUnique({ where: { id }, select: { id: true, publishedAt: true, expiresAt: true } });
  if (!p) throw notFound("Propiedad no encontrada");
  if (moderation === "APPROVED") return db.property.update({ where: { id }, data: await approvalData(p) });
  return db.property.update({ where: { id }, data: { moderation } });
}

export async function bulkAction(ids: string[], action: string) {
  switch (action) {
    case "approve": {
      const rows = await db.property.findMany({ where: { id: { in: ids } }, select: { id: true, publishedAt: true, expiresAt: true } });
      const updates = await Promise.all(rows.map(async (r) => ({ id: r.id, data: await approvalData(r) })));
      await db.$transaction(updates.map((u) => db.property.update({ where: { id: u.id }, data: u.data })));
      return { count: rows.length };
    }
    case "reject":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { moderation: "REJECTED" } });
    case "feature":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { isFeatured: true } });
    case "unfeature":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { isFeatured: false } });
    case "hide":
      return db.property.updateMany({ where: { id: { in: ids } }, data: { status: "HIDDEN" } });
    case "show":
      // Solo las ocultas vuelven a "disponible"; una vendida seleccionada por error no se reactiva.
      return db.property.updateMany({ where: { id: { in: ids }, status: "HIDDEN" }, data: { status: "AVAILABLE" } });
    case "delete": {
      const images = await db.propertyImage.findMany({ where: { propertyId: { in: ids } }, select: { url: true } });
      const r = await db.property.deleteMany({ where: { id: { in: ids } } });
      await cleanupUploads(images.map((i) => i.url));
      return r;
    }
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

const num = (v: string | undefined) => (v === undefined || v.trim() === "" ? null : Number(v));

export async function importProperties(rows: Record<string, string>[], user: SessionUser) {
  let created = 0;
  const errors: string[] = [];
  if (rows.length > 1000) throw badRequest("Máximo 1000 filas por importación");
  for (const [i, r] of rows.entries()) {
    const line = `Fila ${i + 2}`;
    try {
      const city = r.city ? await db.city.findFirst({ where: { OR: [{ name: r.city }, { slug: r.city }] } }) : null;
      const category = r.category ? await db.category.findFirst({ where: { OR: [{ name: r.category }, { slug: r.category }] } }) : null;
      if (r.city && !city) throw badRequest(`ciudad "${r.city}" no existe`);
      if (r.category && !category) throw badRequest(`categoría "${r.category}" no existe`);
      const type = r.type?.toUpperCase() === "RENT" ? "RENT" : "SALE";
      const parsed = propertyInputSchema.safeParse({
        title: r.title, description: r.description || null, content: null, type, status: "AVAILABLE",
        price: num(r.price), currencyCode: (r.currency || "USD").toUpperCase(), period: type === "RENT" ? (r.period?.toUpperCase() || "MONTH") : null, area: num(r.area),
        bedrooms: num(r.bedrooms), bathrooms: num(r.bathrooms), floors: null, parking: num(r.parking), yearBuilt: num(r.yearBuilt),
        address: r.address || null, lat: num(r.lat), lng: num(r.lng), videoUrl: null, isFeatured: false,
        cityId: city?.id ?? null, categoryId: category?.id ?? null, projectId: null, agentId: null, images: r.image ? [{ url: r.image }] : [], featureIds: [], facilities: [], customValues: [], translations: [], expiresAt: null,
        moderation: "APPROVED",
      });
      if (!parsed.success) {
        const detail = Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => `${k}: ${(v as string[])[0]}`).join("; ");
        throw badRequest(detail || "datos inválidos");
      }
      await createProperty(parsed.data, user);
      created++;
    } catch (e) {
      errors.push(`${line}: ${(e as Error).message}`);
    }
  }
  return { created, errors };
}
