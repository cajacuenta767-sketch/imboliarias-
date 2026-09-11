"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
type Row = { id: string; name: string; icon?: string | null; isActive: boolean };
export default function Page() {
  return <SimpleCrud<Row> title="Características" subtitle="Piscina, gimnasio, balcón… se seleccionan en cada propiedad." endpoint="/api/v1/features"
    fields={[{ name: "name", label: "Nombre", required: true }, { name: "icon", label: "Icono (lucide)", half: true }, { name: "isActive", label: "Activa", type: "checkbox", default: true, half: true }]}
    columns={[{ key: "name", header: "Nombre", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "icon", header: "Icono" }, { key: "isActive", header: "Activa", render: (r) => (r.isActive ? "Sí" : "No") }]} />;
}
