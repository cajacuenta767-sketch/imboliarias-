"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
type Row = { id: string; name: string; slug: string; icon?: string | null; order: number; isDefault: boolean; isActive: boolean; _count?: { properties: number } };
export default function Page() {
  return <SimpleCrud<Row> title="Categorías" subtitle="Tipos de inmueble: apartamento, casa, oficina…" endpoint="/api/v1/categories"
    fields={[{ name: "name", label: "Nombre", required: true, half: true }, { name: "icon", label: "Icono (lucide)", half: true, hint: "Ej. Building2, Home, Store", placeholder: "Home" }, { name: "order", label: "Orden", type: "number", half: true, default: 0 }, { name: "isDefault", label: "Por defecto", type: "checkbox", half: true }, { name: "isActive", label: "Activa", type: "checkbox", default: true }]}
    columns={[{ key: "name", header: "Nombre", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "slug", header: "Slug", render: (r) => <code className="text-xs text-ink-muted">{r.slug}</code> }, { key: "icon", header: "Icono" }, { key: "count", header: "Propiedades", render: (r) => r._count?.properties ?? 0 }, { key: "isActive", header: "Activa", render: (r) => (r.isActive ? "Sí" : "No") }]} />;
}
