import { db } from "@/server/db";
import type { PropertyFormOptions } from "@/components/shared/property-form";

export async function getPropertyFormOptions(admin: boolean): Promise<PropertyFormOptions> {
  const [cities, categories, features, facilities, projects, currencies, customFields, agents, users] = await Promise.all([
    db.city.findMany({ where: { isActive: true }, include: { state: true }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.feature.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.facility.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.project.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.currency.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.customField.findMany({ where: { target: "PROPERTY" }, orderBy: { order: "asc" } }),
    admin ? db.agent.findMany({ include: { user: { select: { name: true } } } }) : Promise.resolve(undefined),
    admin ? db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve(undefined),
  ]);
  return {
    cities: cities.map((c) => ({ id: c.id, name: c.name, state: c.state, lat: c.lat, lng: c.lng })) as PropertyFormOptions["cities"],
    categories, features, facilities, projects,
    currencies: currencies.length ? currencies : [{ code: "USD", symbol: "US$" }],
    customFields, agents, users,
  };
}
