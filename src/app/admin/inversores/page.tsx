"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
import { SmartImage } from "@/components/ui/smart-image";
type Row = { id: string; name: string; logoUrl?: string | null; website?: string | null; isActive: boolean; _count?: { projects: number } };
export default function Page() {
  return <SimpleCrud<Row> title="Inversores y constructoras" subtitle="Empresas responsables de los proyectos." endpoint="/api/v1/investors"
    fields={[{ name: "name", label: "Nombre", required: true }, { name: "website", label: "Sitio web" }, { name: "logoUrl", label: "Logo", type: "image" }, { name: "isActive", label: "Activo", type: "checkbox", default: true }]}
    columns={[{ key: "name", header: "Nombre", render: (r) => <div className="flex items-center gap-2">{r.logoUrl && <SmartImage src={r.logoUrl} alt="" className="h-8 w-8 rounded-lg" />}<span className="font-semibold">{r.name}</span></div> }, { key: "website", header: "Web" }, { key: "count", header: "Proyectos", render: (r) => r._count?.projects ?? 0 }]} />;
}
