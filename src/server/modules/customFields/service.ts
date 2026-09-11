import { z } from "zod";
import { db } from "@/server/db";
import { slugify } from "@/lib/utils";
import { CUSTOM_FIELD_TYPES } from "@/lib/constants";

export const customFieldSchema = z.object({
  name: z.string().min(2),
  key: z.string().optional(),
  type: z.enum(CUSTOM_FIELD_TYPES).default("TEXT"),
  options: z.string().optional().nullable(), // separadas por coma
  target: z.enum(["PROPERTY", "PROJECT"]).default("PROPERTY"),
  order: z.coerce.number().int().default(0),
});

export const listCustomFields = (target?: "PROPERTY" | "PROJECT") => db.customField.findMany({ where: target ? { target } : {}, orderBy: { order: "asc" } });
export const createCustomField = (input: z.infer<typeof customFieldSchema>) =>
  db.customField.create({ data: { ...input, key: slugify(input.key || input.name).replace(/-/g, "_") } });
export async function updateCustomField(id: string, input: z.infer<typeof customFieldSchema>) {
  // La clave identifica los valores ya guardados: solo cambia si el admin la escribe explícitamente.
  const existing = await db.customField.findUnique({ where: { id }, select: { key: true } });
  const key = input.key ? slugify(input.key).replace(/-/g, "_") : (existing?.key ?? slugify(input.name).replace(/-/g, "_"));
  return db.customField.update({ where: { id }, data: { ...input, key } });
}
export const deleteCustomField = (id: string) => db.customField.delete({ where: { id } });
