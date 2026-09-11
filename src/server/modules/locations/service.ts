import { z } from "zod";
import { db } from "@/server/db";
import { uniqueSlug } from "@/server/lib/slug";
import { badRequest } from "@/server/errors";
import { publicWhere } from "@/server/modules/properties/service";

export const countrySchema = z.object({ name: z.string().min(2), code: z.string().min(2).max(3).toUpperCase(), isActive: z.coerce.boolean().default(true) });
export const stateSchema = z.object({ name: z.string().min(2), countryId: z.string(), isActive: z.coerce.boolean().default(true) });
export const citySchema = z.object({
  name: z.string().min(2),
  stateId: z.string(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
});

export const listCountries = () => db.country.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { states: true } } } });
export const listStates = (countryId?: string) =>
  db.state.findMany({ where: countryId ? { countryId } : {}, orderBy: { name: "asc" }, include: { country: true, _count: { select: { cities: true } } } });
export const listCities = (stateId?: string, onlyActive = true) =>
  db.city.findMany({
    where: { ...(stateId ? { stateId } : {}), ...(onlyActive ? { isActive: true } : {}) },
    orderBy: { name: "asc" },
    include: { state: { include: { country: true } }, _count: { select: { properties: { where: publicWhere() } } } },
  });

/** Lista ligera para selectores (id, nombre, coordenadas). */
export const cityOptions = () =>
  db.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, lat: true, lng: true, state: { select: { name: true } } } });

export const featuredCities = () =>
  db.city.findMany({
    where: { isFeatured: true, isActive: true },
    include: { state: true, _count: { select: { properties: { where: publicWhere() } } } },
    take: 6,
  });

export async function createCity(input: z.infer<typeof citySchema>) {
  const slug = await uniqueSlug(input.name, async (s) => !!(await db.city.findUnique({ where: { slug: s } })));
  return db.city.create({ data: { ...input, slug } });
}
export async function updateCity(id: string, input: Partial<z.infer<typeof citySchema>>) {
  const data = { ...input } as Record<string, unknown>;
  if (input.name) data.slug = await uniqueSlug(input.name, async (s) => !!(await db.city.findFirst({ where: { slug: s, NOT: { id } } })));
  return db.city.update({ where: { id }, data });
}
export async function deleteCity(id: string) {
  const [props, projects] = await Promise.all([db.property.count({ where: { cityId: id } }), db.project.count({ where: { cityId: id } })]);
  if (props + projects > 0) throw badRequest(`La ciudad tiene ${props} propiedad(es) y ${projects} proyecto(s). Reasígnalos o desactívala.`);
  return db.city.delete({ where: { id } });
}

export const createCountry = (input: z.infer<typeof countrySchema>) => db.country.create({ data: input });
export const updateCountry = (id: string, input: Partial<z.infer<typeof countrySchema>>) => db.country.update({ where: { id }, data: input });
export const deleteCountry = (id: string) => db.country.delete({ where: { id } });
export const createState = (input: z.infer<typeof stateSchema>) => db.state.create({ data: input });
export const updateState = (id: string, input: Partial<z.infer<typeof stateSchema>>) => db.state.update({ where: { id }, data: input });
export const deleteState = (id: string) => db.state.delete({ where: { id } });

export const cityLabel = (c: { name: string; state?: { name: string } | null } | null | undefined) =>
  c ? (c.state ? `${c.name}, ${c.state.name}` : c.name) : "";
