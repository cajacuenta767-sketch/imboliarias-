"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, LogOut } from "lucide-react";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { RichEditor } from "@/components/shared/rich-editor";
import { ImageUploader, type ImageItem } from "@/components/shared/image-uploader";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MapPicker = dynamic(() => import("@/components/shared/map-picker").then((m) => m.MapPicker), { ssr: false });

export type ProjectFormValues = { name: string; description: string; content: string; status: string; priceFrom: number | ""; priceTo: number | ""; currencyCode: string; address: string; lat: number | null; lng: number | null; units: number | ""; floors: number | ""; finishAt: string; videoUrl: string; isFeatured: boolean; cityId: string; categoryId: string; investorId: string; images: ImageItem[]; featureIds: string[]; facilities: { facilityId: string; distance: string }[] };
type Opt = { id: string; name: string };
export type ProjectFormOptions = { cities: Opt[]; categories: Opt[]; investors: Opt[]; features: Opt[]; facilities: Opt[]; currencies: { code: string; symbol: string }[] };

export function ProjectForm({ initial, id, options }: { initial: ProjectFormValues; id?: string; options: ProjectFormOptions }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const set = <K extends keyof ProjectFormValues>(k: K, val: ProjectFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const num = (s: string) => (s === "" ? "" : Number(s));
  const submit = async (exit: boolean) => {
    setSaving(true); setErrors({});
    try {
      const payload = { ...v, priceFrom: v.priceFrom === "" ? null : v.priceFrom, priceTo: v.priceTo === "" ? null : v.priceTo, units: v.units === "" ? null : v.units, floors: v.floors === "" ? null : v.floors, finishAt: v.finishAt || null, cityId: v.cityId || null, categoryId: v.categoryId || null, investorId: v.investorId || null };
      if (id) await apiPut(`/api/v1/projects/${id}`, payload); else await apiPost("/api/v1/projects", payload);
      toast.success("Proyecto guardado");
      if (exit || !id) router.push("/admin/proyectos");
      router.refresh();
    } catch (e) { if (e instanceof ApiError && e.details) setErrors(e.details); toast.error((e as Error).message); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="card space-y-4 p-5">
          <Field label="Nombre" required error={errors.name?.[0]}><input className="input text-base font-semibold" value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Descripción corta"><textarea className="input min-h-[80px]" maxLength={600} value={v.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Contenido"><RichEditor value={v.content} onChange={(h) => set("content", h)} /></Field>
        </div>
        <div className="card grid gap-4 p-5 sm:grid-cols-3">
          <Field label="Precio desde"><input type="number" className="input" value={v.priceFrom} onChange={(e) => set("priceFrom", num(e.target.value))} /></Field>
          <Field label="Precio hasta"><input type="number" className="input" value={v.priceTo} onChange={(e) => set("priceTo", num(e.target.value))} /></Field>
          <Field label="Moneda"><select className="input cursor-pointer" value={v.currencyCode} onChange={(e) => set("currencyCode", e.target.value)}>{options.currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select></Field>
          <Field label="Unidades"><input type="number" className="input" value={v.units} onChange={(e) => set("units", num(e.target.value))} /></Field>
          <Field label="Pisos"><input type="number" className="input" value={v.floors} onChange={(e) => set("floors", num(e.target.value))} /></Field>
          <Field label="Fecha de entrega"><input type="date" className="input" value={v.finishAt} onChange={(e) => set("finishAt", e.target.value)} /></Field>
          <Field label="Video (YouTube)" className="sm:col-span-3"><input className="input" value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} /></Field>
        </div>
        <div className="card p-5"><p className="label">Imágenes</p><ImageUploader value={v.images} onChange={(im) => set("images", im)} folder="projects" /></div>
        <div className="card space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ciudad"><select className="input cursor-pointer" value={v.cityId} onChange={(e) => set("cityId", e.target.value)}><option value="">—</option>{options.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Dirección"><input className="input" value={v.address} onChange={(e) => set("address", e.target.value)} /></Field>
          </div>
          <MapPicker lat={v.lat} lng={v.lng} onChange={(la, ln) => setV((s) => ({ ...s, lat: la, lng: ln }))} />
        </div>
        <div className="card space-y-5 p-5">
          <div><p className="label">Amenidades</p><div className="flex flex-wrap gap-2">{options.features.map((f) => { const on = v.featureIds.includes(f.id); return <button type="button" key={f.id} onClick={() => set("featureIds", on ? v.featureIds.filter((x) => x !== f.id) : [...v.featureIds, f.id])} className={cn("chip border", on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated text-ink-soft")}>{f.name}</button>; })}</div></div>
          <div><p className="label">Lugares cercanos</p><div className="grid gap-2 sm:grid-cols-2">{options.facilities.map((f) => { const cur = v.facilities.find((x) => x.facilityId === f.id); return (
            <label key={f.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2 text-sm", cur ? "border-brand bg-brand-soft/40" : "border-line")}><input type="checkbox" className="h-4 w-4 accent-brand" checked={!!cur} onChange={(e) => set("facilities", e.target.checked ? [...v.facilities, { facilityId: f.id, distance: "" }] : v.facilities.filter((x) => x.facilityId !== f.id))} /><span className="flex-1">{f.name}</span>{cur && <input className="input w-24 py-1 text-xs" placeholder="500 m" value={cur.distance} onChange={(e) => set("facilities", v.facilities.map((x) => (x.facilityId === f.id ? { ...x, distance: e.target.value } : x)))} />}</label>
          ); })}</div></div>
        </div>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-2 p-5">
          <h3 className="font-display font-bold">Publicar</h3>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Spinner /> : <Save className="h-4 w-4" />} Guardar</button>
          <button type="button" disabled={saving} onClick={() => submit(true)} className="btn-outline w-full"><LogOut className="h-4 w-4" /> Guardar y salir</button>
        </div>
        <div className="card space-y-4 p-5">
          <Switch checked={v.isFeatured} onChange={(b) => set("isFeatured", b)} label="Proyecto destacado" />
          <Field label="Estado"><select className="input cursor-pointer" value={v.status} onChange={(e) => set("status", e.target.value)}>{PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field>
          <Field label="Categoría"><select className="input cursor-pointer" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">—</option>{options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Inversor / constructora"><select className="input cursor-pointer" value={v.investorId} onChange={(e) => set("investorId", e.target.value)}><option value="">—</option>{options.investors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </div>
      </aside>
    </form>
  );
}
