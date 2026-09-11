import { z } from "zod";
import { db } from "@/server/db";
import { uniqueSlug } from "@/server/lib/slug";
import { badRequest } from "@/server/errors";
import { publicWhere } from "@/server/modules/properties/service";

export const categorySchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional().nullable(),
  order: z.coerce.number().int().default(0),
  isDefault: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const listCategories = (onlyActive = false) =>
  db.category.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: { order: "asc" },
    include: { _count: { select: { properties: { where: publicWhere() } } } },
  });

export async function createCategory(input: z.infer<typeof categorySchema>) {
  const slug = await uniqueSlug(input.name, async (s) => !!(await db.category.findUnique({ where: { slug: s } })));
  return db.category.create({ data: { ...input, slug } });
}
export const updateCategory = (id: string, input: Partial<z.infer<typeof categorySchema>>) => db.category.update({ where: { id }, data: input });
export async function deleteCategory(id: string) {
  const [props, projects] = await Promise.all([db.property.count({ where: { categoryId: id } }), db.project.count({ where: { categoryId: id } })]);
  if (props + projects > 0) throw badRequest(`La categoría tiene ${props} propiedad(es) y ${projects} proyecto(s). Reasígnalos o desactívala.`);
  return db.category.delete({ where: { id } });
}
