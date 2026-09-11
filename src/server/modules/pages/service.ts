import { z } from "zod";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { uniqueSlug } from "@/server/lib/slug";
import { CONTENT_STATUSES } from "@/lib/constants";

export const pageSchema = z.object({
  title: z.string().min(2),
  slug: z.string().optional(),
  content: z.string().optional().nullable(),
  template: z.enum(["default", "full-width", "contact"]).default("default"),
  status: z.enum(CONTENT_STATUSES).default("PUBLISHED"),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

export const listPages = (onlyPublished = false) => db.page.findMany({ where: onlyPublished ? { status: "PUBLISHED" } : {}, orderBy: { title: "asc" } });
export async function getPageBySlug(slug: string) {
  const p = await db.page.findUnique({ where: { slug } });
  if (!p || p.status !== "PUBLISHED") throw notFound("Página no encontrada");
  return p;
}
export async function createPage(input: z.infer<typeof pageSchema>) {
  const slug = await uniqueSlug(input.slug || input.title, async (s) => !!(await db.page.findUnique({ where: { slug: s } })));
  return db.page.create({ data: { ...input, slug } });
}
export async function updatePage(id: string, input: z.infer<typeof pageSchema>) {
  const data = { ...input } as Record<string, unknown>;
  if (input.slug) data.slug = await uniqueSlug(input.slug, async (s) => !!(await db.page.findFirst({ where: { slug: s, NOT: { id } } })));
  else delete data.slug;
  return db.page.update({ where: { id }, data });
}
export const deletePage = (id: string) => db.page.delete({ where: { id } });
