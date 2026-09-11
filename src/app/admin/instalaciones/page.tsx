"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
type Row = { id: string; name: string; icon?: string | null; isActive: boolean };
export default function Page() {
  return <SimpleCrud<Row> title="Instalaciones cercanas" subtitle="Colegios, hospitales, centros comerciales… con distancia por propiedad." endpoint="/api/v1/facilities"
    fields={[{ name: "name", label: "Nombre", required: true }, { name: "icon", label: "Icono (lucide)", half: true }, { name: "isActive", label: "Activa", type: "checkbox", default: true, half: true }]}
    columns={[{ key: "name", header: "Nombre", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "icon", header: "Icono" }, { key: "isActive", header: "Activa", render: (r) => (r.isActive ? "Sí" : "No") }]} />;
}
