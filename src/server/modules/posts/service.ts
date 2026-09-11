import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { paginationSchema, paginate, meta } from "@/server/lib/pagination";
import { uniqueSlug } from "@/server/lib/slug";
import { CONTENT_STATUSES } from "@/lib/constants";

export const postSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().max(400).optional().nullable(),
  content: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  status: z.enum(CONTENT_STATUSES).default("PUBLISHED"),
  isFeatured: z.coerce.boolean().default(false),
  categoryId: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
});
export const postQuerySchema = paginationSchema.extend({ q: z.string().optional(), category: z.string().optional(), scope: z.enum(["public", "admin"]).default("public") });
export const postCategorySchema = z.object({ name: z.string().min(2) });

export const postInclude = { author: { select: { name: true, avatarUrl: true } }, category: true } satisfies Prisma.PostInclude;
export type PostCard = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export async function listPosts(q: z.infer<typeof postQuerySchema>) {
  const where: Prisma.PostWhereInput = {
    ...(q.scope === "public" ? { status: "PUBLISHED" } : {}),
    ...(q.q ? { OR: [{ title: { contains: q.q } }, { excerpt: { contains: q.q } }] } : {}),
    ...(q.category ? { category: { OR: [{ slug: q.category }, { id: q.category }] } } : {}),
  };
  const [items, total] = await Promise.all([
    db.post.findMany({ where, include: postInclude, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], ...paginate(q) }),
    db.post.count({ where }),
  ]);
  return { items, meta: meta(q, total) };
}
export const latestPosts = (take = 3) => db.post.findMany({ where: { status: "PUBLISHED" }, include: postInclude, orderBy: { publishedAt: "desc" }, take });

export async function getPostBySlug(slug: string, countView = false) {
  const p = await db.post.findUnique({ where: { slug }, include: postInclude });
  if (!p || p.status !== "PUBLISHED") throw notFound("Artículo no encontrado");
  if (countView) db.post.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => undefined);
  return p;
}
export async function getPostById(id: string) {
  const p = await db.post.findUnique({ where: { id }, include: postInclude });
  if (!p) throw notFound();
  return p;
}
export async function createPost(input: z.infer<typeof postSchema>, authorId: string) {
  const slug = await uniqueSlug(input.title, async (s) => !!(await db.post.findUnique({ where: { slug: s } })));
  return db.post.create({ data: { ...input, slug, authorId, publishedAt: input.publishedAt ?? new Date(), categoryId: input.categoryId || null } });
}
export async function updatePost(id: string, input: z.infer<typeof postSchema>) {
  return db.post.update({ where: { id }, data: { ...input, categoryId: input.categoryId || null } });
}
export const deletePost = (id: string) => db.post.delete({ where: { id } });

export const listPostCategories = () => db.postCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } });
export async function createPostCategory(input: z.infer<typeof postCategorySchema>) {
  const slug = await uniqueSlug(input.name, async (s) => !!(await db.postCategory.findUnique({ where: { slug: s } })));
  return db.postCategory.create({ data: { ...input, slug } });
}
export const deletePostCategory = (id: string) => db.postCategory.delete({ where: { id } });
