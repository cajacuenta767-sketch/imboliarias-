export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Habitta";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const ROLES = ["ADMIN", "AGENT", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const PROPERTY_TYPES = ["SALE", "RENT"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ["AVAILABLE", "RESERVED", "SOLD", "RENTED", "HIDDEN"] as const;
export const MODERATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const RENT_PERIODS = ["MONTH", "YEAR", "DAY"] as const;
export const PROJECT_STATUSES = ["SELLING", "BUILDING", "FINISHED", "COMING_SOON"] as const;
export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const INQUIRY_STATUSES = ["NEW", "READ", "REPLIED", "CLOSED"] as const;
export const INVOICE_STATUSES = ["PENDING", "PAID", "CANCELLED", "REFUNDED"] as const;
export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const CAREER_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE"] as const;
export const CAREER_STATUSES = ["OPEN", "CLOSED"] as const;
export const COUPON_TYPES = ["PERCENT", "FIXED"] as const;
export const CUSTOM_FIELD_TYPES = ["TEXT", "NUMBER", "SELECT", "CHECKBOX"] as const;
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export const CREDITS_PER_LISTING = 1;
export const CREDITS_PER_FEATURED = 2;
export const DEFAULT_LISTING_DAYS = 45;

export const STATUS_LABELS: Record<string, string> = {
  SALE: "Venta",
  RENT: "Alquiler",
  AVAILABLE: "Disponible",
  RESERVED: "Reservada",
  SOLD: "Vendida",
  RENTED: "Alquilada",
  HIDDEN: "Oculta",
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  SELLING: "En venta",
  BUILDING: "En construcción",
  FINISHED: "Terminado",
  COMING_SOON: "Próximamente",
  NEW: "Nueva",
  READ: "Leída",
  REPLIED: "Respondida",
  CLOSED: "Cerrada",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  OPEN: "Abierta",
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  CONTRACT: "Contrato",
  REMOTE: "Remoto",
  ADMIN: "Administrador",
  AGENT: "Agente",
  CUSTOMER: "Cliente",
  MONTH: "mes",
  YEAR: "año",
  DAY: "día",
};
