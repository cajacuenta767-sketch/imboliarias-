import { z } from "zod";
import { db } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { REVIEW_STATUSES } from "@/lib/constants";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";

export const reviewInputSchema = z.object({
  propertyId: z.string().max(64),
  authorName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
});
export const reviewQuerySchema = paginationSchema.extend({ status: z.enum(REVIEW_STATUSES).optional(), propertyId: z.string().optional() });

export async function createReview(input: z.infer<typeof reviewInputSchema>, userId?: string) {
  const p = await db.property.findUnique({ where: { id: input.propertyId }, select: { moderation: true, status: true, authorId: true } });
  if (!p || p.moderation !== "APPROVED" || p.status === "HIDDEN") throw notFound("Propiedad no encontrada");
  if (userId) {
    if (p.authorId === userId) throw badRequest("No puedes reseñar tu propia propiedad");
    const dup = await db.review.findFirst({ where: { propertyId: input.propertyId, userId } });
    if (dup) throw badRequest("Ya enviaste una reseña de esta propiedad");
  }
  return db.review.create({ data: { ...input, userId: userId ?? null, status: "PENDING" } });
}

export async function listReviews(q: z.infer<typeof reviewQuerySchema>) {
  const where = { ...(q.status ? { status: q.status } : {}), ...(q.propertyId ? { propertyId: q.propertyId } : {}) };
  const [items, total] = await Promise.all([
    db.review.findMany({ where, include: { property: { select: { title: true, slug: true } } }, orderBy: { createdAt: "desc" }, ...paginate(q) }),
    db.review.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}

export const updateReviewStatus = (id: string, status: string) => db.review.update({ where: { id }, data: { status } });
export const deleteReview = (id: string) => db.review.delete({ where: { id } });

export async function ratingSummary(propertyId: string) {
  const agg = await db.review.aggregate({ where: { propertyId, status: "APPROVED" }, _avg: { rating: true }, _count: true });
  return { avg: agg._avg.rating ?? 0, count: agg._count };
}
