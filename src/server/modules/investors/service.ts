import { z } from "zod";
import { db } from "@/server/db";
import { uniqueSlug } from "@/server/lib/slug";

export const investorSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

export const listInvestors = () => db.investor.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { projects: true } } } });
export async function createInvestor(input: z.infer<typeof investorSchema>) {
  const slug = await uniqueSlug(input.name, async (s) => !!(await db.investor.findUnique({ where: { slug: s } })));
  return db.investor.create({ data: { ...input, slug } });
}
export const updateInvestor = (id: string, input: Partial<z.infer<typeof investorSchema>>) => db.investor.update({ where: { id }, data: input });
export const deleteInvestor = (id: string) => db.investor.delete({ where: { id } });
