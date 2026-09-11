"use client";
import { useState } from "react";
import { SimpleCrud } from "@/components/admin/simple-crud";
import { Tabs } from "@/components/ui/tabs";
import { apiGet } from "@/lib/api";

type Country = { id: string; name: string; code: string; isActive: boolean; _count?: { states: number } };
type State = { id: string; name: string; countryId: string; isActive: boolean; country?: { name: string }; _count?: { cities: number } };
type City = { id: string; name: string; slug: string; stateId: string; lat?: number | null; lng?: number | null; imageUrl?: string | null; isFeatured: boolean; isActive: boolean; state?: { name: string }; _count?: { properties: number } };

export default function LocationsPage() {
  const [tab, setTab] = useState<"cities" | "states" | "countries">("cities");
  const countries = async () => (await apiGet<Country[]>("/api/v1/locations/countries")).data.map((c) => ({ value: c.id, label: c.name }));
  const states = async () => (await apiGet<State[]>("/api/v1/locations/states")).data.map((s) => ({ value: s.id, label: `${s.name}${s.country ? ` (${s.country.name})` : ""}` }));
  return (
    <div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} items={[{ value: "cities", label: "Ciudades" }, { value: "states", label: "Departamentos / Estados" }, { value: "countries", label: "Países" }]} /></div>
      {tab === "cities" && (
        <SimpleCrud<City> key="cities" title="Ciudades" subtitle="Las ciudades con coordenadas centran el mapa al elegirlas." endpoint="/api/v1/locations/cities"
          fields={[{ name: "name", label: "Nombre", required: true, half: true }, { name: "stateId", label: "Departamento", type: "select", required: true, half: true, options: states }, { name: "lat", label: "Latitud", type: "number", half: true }, { name: "lng", label: "Longitud", type: "number", half: true }, { name: "imageUrl", label: "Imagen", type: "image" }, { name: "isFeatured", label: "Destacada en el inicio", type: "checkbox", half: true }, { name: "isActive", label: "Activa", type: "checkbox", default: true, half: true }]}
          columns={[{ key: "name", header: "Ciudad", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "state", header: "Departamento", render: (r) => r.state?.name ?? "" }, { key: "coords", header: "Coordenadas", render: (r) => (r.lat != null ? `${r.lat.toFixed(3)}, ${r.lng?.toFixed(3)}` : "—") }, { key: "count", header: "Propiedades", render: (r) => r._count?.properties ?? 0 }, { key: "isFeatured", header: "Destacada", render: (r) => (r.isFeatured ? "Sí" : "—") }]} />
      )}
      {tab === "states" && (
        <SimpleCrud<State> key="states" title="Departamentos / Estados" endpoint="/api/v1/locations/states"
          fields={[{ name: "name", label: "Nombre", required: true, half: true }, { name: "countryId", label: "País", type: "select", required: true, half: true, options: countries }, { name: "isActive", label: "Activo", type: "checkbox", default: true }]}
          columns={[{ key: "name", header: "Nombre", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "country", header: "País", render: (r) => r.country?.name ?? "" }, { key: "count", header: "Ciudades", render: (r) => r._count?.cities ?? 0 }]} />
      )}
      {tab === "countries" && (
        <SimpleCrud<Country> key="countries" title="Países" endpoint="/api/v1/locations/countries"
          fields={[{ name: "name", label: "Nombre", required: true, half: true }, { name: "code", label: "Código ISO", required: true, half: true, placeholder: "CO" }, { name: "isActive", label: "Activo", type: "checkbox", default: true }]}
          columns={[{ key: "name", header: "Nombre", render: (r) => <span className="font-semibold">{r.name}</span> }, { key: "code", header: "Código" }, { key: "count", header: "Departamentos", render: (r) => r._count?.states ?? 0 }]} />
      )}
    </div>
  );
}
