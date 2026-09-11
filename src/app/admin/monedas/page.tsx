"use client";
import { SimpleCrud } from "@/components/admin/simple-crud";
type Row = { id: string; code: string; name: string; symbol: string; rate: number; decimals: number; isDefault: boolean; isActive: boolean; order: number };
export default function Page() {
  return <SimpleCrud<Row> title="Monedas" subtitle="La tasa es relativa a la moneda por defecto (1 USD = 4100 COP → tasa 4100)." endpoint="/api/v1/currencies" idKey="code" listQuery="?all=1" createMethod="PUT"
    fields={[{ name: "code", label: "Código ISO", required: true, half: true, placeholder: "COP" }, { name: "symbol", label: "Símbolo", required: true, half: true, placeholder: "$" }, { name: "name", label: "Nombre", required: true }, { name: "rate", label: "Tasa", type: "number", required: true, half: true, default: 1 }, { name: "decimals", label: "Decimales", type: "number", half: true, default: 0 }, { name: "order", label: "Orden", type: "number", half: true, default: 0 }, { name: "isDefault", label: "Moneda por defecto", type: "checkbox", half: true }, { name: "isActive", label: "Activa", type: "checkbox", default: true }]}
    columns={[{ key: "code", header: "Código", render: (r) => <b>{r.code}</b> }, { key: "name", header: "Nombre" }, { key: "symbol", header: "Símbolo" }, { key: "rate", header: "Tasa" }, { key: "isDefault", header: "Por defecto", render: (r) => (r.isDefault ? "Sí" : "—") }]} />;
}
