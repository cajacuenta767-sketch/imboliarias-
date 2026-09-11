import type { ContentField } from "@/components/admin/content-form";

export const PAGE_FIELDS: ContentField[] = [
  { key: "title", label: "Título", required: true },
  { key: "slug", label: "Slug (URL)", hint: "Se genera del título si se deja vacío", half: true },
  { key: "template", label: "Plantilla", type: "select", half: true, options: [{ value: "default", label: "Estándar" }, { value: "full-width", label: "Ancho completo" }, { value: "contact", label: "Contacto" }] },
  { key: "content", label: "Contenido", type: "rich" },
  { key: "metaTitle", label: "Meta título (SEO)" },
  { key: "metaDescription", label: "Meta descripción (SEO)", type: "textarea" },
  { key: "status", label: "Estado", type: "select", side: true, options: [{ value: "PUBLISHED", label: "Publicada" }, { value: "DRAFT", label: "Borrador" }] },
];

export const POST_FIELDS = (categories: { value: string; label: string }[]): ContentField[] => [
  { key: "title", label: "Título", required: true },
  { key: "excerpt", label: "Resumen", type: "textarea" },
  { key: "content", label: "Contenido", type: "rich" },
  { key: "coverUrl", label: "Imagen de portada", type: "image" },
  { key: "tags", label: "Etiquetas (separadas por coma)" },
  { key: "status", label: "Estado", type: "select", side: true, options: [{ value: "PUBLISHED", label: "Publicado" }, { value: "DRAFT", label: "Borrador" }] },
  { key: "categoryId", label: "Categoría", type: "select", side: true, options: categories },
  { key: "publishedAt", label: "Fecha de publicación", type: "date", side: true },
  { key: "isFeatured", label: "Destacado", type: "boolean", side: true },
];

export const CAREER_FIELDS: ContentField[] = [
  { key: "title", label: "Título de la vacante", required: true },
  { key: "description", label: "Descripción corta", type: "textarea" },
  { key: "content", label: "Detalle (responsabilidades, requisitos…)", type: "rich" },
  { key: "location", label: "Ubicación", half: true },
  { key: "salary", label: "Salario", half: true },
  { key: "type", label: "Tipo", type: "select", side: true, options: [{ value: "FULL_TIME", label: "Tiempo completo" }, { value: "PART_TIME", label: "Medio tiempo" }, { value: "CONTRACT", label: "Contrato" }, { value: "REMOTE", label: "Remoto" }] },
  { key: "status", label: "Estado", type: "select", side: true, options: [{ value: "OPEN", label: "Abierta" }, { value: "CLOSED", label: "Cerrada" }] },
  { key: "deadline", label: "Fecha límite", type: "date", side: true },
];
