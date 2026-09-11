import { z } from "zod";
import { MODERATION_STATUSES, PROPERTY_STATUSES, PROPERTY_TYPES, RENT_PERIODS } from "@/lib/constants";
import { paginationSchema } from "@/server/lib/pagination";

export const propertyInputSchema = z.object({
  title: z.string().min(5, "El título es muy corto").max(160),
  description: z.string().max(600).optional().nullable(),
  content: z.string().optional().nullable(),
  type: z.enum(PROPERTY_TYPES),
  status: z.enum(PROPERTY_STATUSES).default("AVAILABLE"),
  moderation: z.enum(MODERATION_STATUSES).optional(),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  currencyCode: z.string().length(3).default("USD"),
  period: z.enum(RENT_PERIODS).optional().nullable(),
  area: z.coerce.number().nonnegative().optional().nullable(),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  floors: z.coerce.number().int().min(0).optional().nullable(),
  parking: z.coerce.number().int().min(0).optional().nullable(),
  yearBuilt: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  isFeatured: z.coerce.boolean().default(false),
  cityId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  authorId: z.string().optional(),
  images: z.array(z.object({ url: z.string().min(1), alt: z.string().optional().nullable() })).default([]),
  featureIds: z.array(z.string()).default([]),
  facilities: z.array(z.object({ facilityId: z.string(), distance: z.string().optional().nullable() })).default([]),
  customValues: z.array(z.object({ fieldId: z.string(), value: z.string() })).default([]),
  translations: z
    .array(z.object({ locale: z.string(), field: z.string(), value: z.string() }))
    .default([]),
  expiresAt: z.coerce.date().optional().nullable(),
});
export type PropertyInput = z.infer<typeof propertyInputSchema>;

export const propertyQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  city: z.string().optional(), // slug o id
  category: z.string().optional(), // slug o id
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  features: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(",").filter(Boolean)))
    .optional(),
  featured: z.coerce.boolean().optional(),
  agent: z.string().optional(),
  project: z.string().optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
  moderation: z.enum(MODERATION_STATUSES).optional(),
  authorId: z.string().optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "area_desc", "views"]).default("newest"),
  bbox: z.string().optional(), // "south,west,north,east"
  scope: z.enum(["public", "admin", "mine"]).default("public"),
});
export type PropertyQuery = z.infer<typeof propertyQuerySchema>;

export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["approve", "reject", "delete", "feature", "unfeature", "hide", "show"]),
});
