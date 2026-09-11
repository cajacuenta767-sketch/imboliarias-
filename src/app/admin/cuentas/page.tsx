"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
type Row = { id: string; name: string; email: string; role: string; phone?: string | null; avatarUrl?: string | null; credits: number; isActive: boolean; createdAt: string; _count?: { properties: number } };
export default function Page() {
  return <SimpleCrud<Row> title="Cuentas" subtitle="Administradores, agentes y clientes." endpoint="/api/v1/users" paginated searchPlaceholder="Nombre o correo…"
    fields={[{ name: "name", label: "Nombre", required: true, half: true }, { name: "email", label: "Correo", type: "email", required: true, half: true }, { name: "role", label: "Rol", type: "select", default: "AGENT", half: true, options: [{ value: "ADMIN", label: "Administrador" }, { value: "AGENT", label: "Agente" }, { value: "CUSTOMER", label: "Cliente" }] }, { name: "credits", label: "Créditos", type: "number", default: 0, half: true }, { name: "phone", label: "Teléfono", half: true }, { name: "password", label: "Contraseña", type: "password", half: true, hint: "Mínimo 8 caracteres. Al editar, vacío = no cambiar" }, { name: "avatarUrl", label: "Foto", type: "image" }, { name: "isActive", label: "Cuenta activa", type: "checkbox", default: true }]}
    columns={[{ key: "name", header: "Usuario", render: (r) => <div className="flex items-center gap-2"><Avatar src={r.avatarUrl} name={r.name} size="sm" /><div><p className="font-semibold">{r.name}</p><p className="text-xs text-ink-muted">{r.email}</p></div></div> }, { key: "role", header: "Rol", render: (r) => <StatusBadge value={r.role} /> }, { key: "credits", header: "Créditos" }, { key: "count", header: "Propiedades", render: (r) => r._count?.properties ?? 0 }, { key: "isActive", header: "Activa", render: (r) => (r.isActive ? "Sí" : <span className="text-danger">No</span>) }, { key: "createdAt", header: "Alta", render: (r) => formatDate(r.createdAt) }]} />;
}
