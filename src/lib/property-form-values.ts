import type { PropertyFormValues } from "@/components/shared/property-form";
import type { PropertyFull } from "@/server/modules/properties/service";

export const emptyPropertyValues: PropertyFormValues = {
  title: "", description: "", content: "", type: "SALE", status: "AVAILABLE", moderation: "PENDING", price: "", currencyCode: "USD", period: "MONTH", area: "", bedrooms: "", bathrooms: "", floors: "", parking: "", yearBuilt: "",
  address: "", lat: null, lng: null, videoUrl: "", isFeatured: false, cityId: "", categoryId: "", projectId: "", agentId: "", authorId: "", images: [], featureIds: [], facilities: [], customValues: [], translations: [],
};

export function toPropertyFormValues(p: PropertyFull): PropertyFormValues {
  return {
    title: p.title, description: p.description ?? "", content: p.content ?? "", type: p.type as "SALE" | "RENT", status: p.status, moderation: p.moderation, price: p.price, currencyCode: p.currencyCode, period: p.period ?? "MONTH",
    area: p.area ?? "", bedrooms: p.bedrooms ?? "", bathrooms: p.bathrooms ?? "", floors: p.floors ?? "", parking: p.parking ?? "", yearBuilt: p.yearBuilt ?? "", address: p.address ?? "", lat: p.lat, lng: p.lng, videoUrl: p.videoUrl ?? "", isFeatured: p.isFeatured,
    cityId: p.cityId ?? "", categoryId: p.categoryId ?? "", projectId: p.projectId ?? "", agentId: p.agentId ?? "", authorId: p.authorId,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })), featureIds: p.features.map((f) => f.featureId), facilities: p.facilities.map((f) => ({ facilityId: f.facilityId, distance: f.distance ?? "" })),
    customValues: p.customValues.map((c) => ({ fieldId: c.fieldId, value: c.value })), translations: p.translations.map((t) => ({ locale: t.locale, field: t.field, value: t.value })),
  };
}
