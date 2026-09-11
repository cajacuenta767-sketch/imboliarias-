"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
import { StatusBadge } from "@/components/ui/badge";
type Row = { id: string; name: string; key: string; type: string; options?: string | null; target: string; order: number };
export default function Page() {
  return <SimpleCrud<Row> title="Campos personalizados" subtitle="Añade campos extra al formulario de propiedades o proyectos (estrato, administración, etc.)." endpoint="/api/v1/custom-fields"
    fields={[{ name: "name", label: "Nombre", required: true, half: true }, { name: "key", label: "Clave", half: true, hint: "Se genera automáticamente si se deja vacía" }, { name: "type", label: "Tipo", type: "select", half: true, default: "TEXT", options: [{ value: "TEXT", label: "Texto" }, { value: "NUMBER", label: "Número" }, { value: "SELECT", label: "Selección" }, { value: "CHECKBOX", label: "Sí/No" }] }, { name: "target", label: "Aplica a", type: "select", half: true, default: "PROPERTY", options: [{ value: "PROPERTY", label: "Propiedades" }, { value: "PROJECT", label: "Proyectos" }] }, { name: "options", label: "Opciones (separadas por coma)", placeholder: "1,2,3,4,5,6" }, { name: "order", label: "Orden", type: "number", default: 0, half: true }]}
    columns={[{ key: "name", header: "Nombre", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "key", header: "Clave", render: (r) => <code className="text-xs">{r.key}</code> }, { key: "type", header: "Tipo" }, { key: "target", header: "Aplica a", render: (r) => <StatusBadge value={r.target} label={r.target === "PROPERTY" ? "Propiedades" : "Proyectos"} /> }]} />;
}
