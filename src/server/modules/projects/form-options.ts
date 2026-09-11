import { db } from "@/server/db";
import type { ProjectFormOptions, ProjectFormValues } from "@/components/admin/project-form";
import type { ProjectFull } from "./service";

export async function getProjectFormOptions(): Promise<ProjectFormOptions> {
  const [cities, categories, investors, features, facilities, currencies] = await Promise.all([
    db.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }), db.category.findMany({ orderBy: { order: "asc" } }), db.investor.findMany({ orderBy: { name: "asc" } }),
    db.feature.findMany({ orderBy: { name: "asc" } }), db.facility.findMany({ orderBy: { name: "asc" } }), db.currency.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);
  return { cities, categories, investors, features, facilities, currencies: currencies.length ? currencies : [{ code: "USD", symbol: "US$" }] };
}

export const emptyProjectValues: ProjectFormValues = { name: "", description: "", content: "", status: "SELLING", priceFrom: "", priceTo: "", currencyCode: "USD", address: "", lat: null, lng: null, units: "", floors: "", finishAt: "", videoUrl: "", isFeatured: false, cityId: "", categoryId: "", investorId: "", images: [], featureIds: [], facilities: [] };

export function toProjectFormValues(p: ProjectFull): ProjectFormValues {
  return {
    name: p.name, description: p.description ?? "", content: p.content ?? "", status: p.status, priceFrom: p.priceFrom ?? "", priceTo: p.priceTo ?? "", currencyCode: p.currencyCode, address: p.address ?? "", lat: p.lat, lng: p.lng, units: p.units ?? "", floors: p.floors ?? "",
    finishAt: p.finishAt ? p.finishAt.toISOString().slice(0, 10) : "", videoUrl: p.videoUrl ?? "", isFeatured: p.isFeatured, cityId: p.cityId ?? "", categoryId: p.categoryId ?? "", investorId: p.investorId ?? "",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })), featureIds: p.features.map((f) => f.featureId), facilities: p.facilities.map((f) => ({ facilityId: f.facilityId, distance: f.distance ?? "" })),
  };
}
