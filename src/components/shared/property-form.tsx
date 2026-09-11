"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Copy, LogOut, Sparkles, Coins, Info } from "lucide-react";
import Link from "next/link";
import { apiPost, apiPut, ApiError } from "@/lib/api";
import { Field, Spinner } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { ImageUploader, type ImageItem } from "@/components/shared/image-uploader";
import { STATUS_LABELS, PROPERTY_STATUSES, MODERATION_STATUSES, RENT_PERIODS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MapPicker = dynamic(() => import("@/components/shared/map-picker").then((m) => m.MapPicker), { ssr: false, loading: () => <div className="h-[320px] animate-pulse rounded-2xl bg-muted" /> });
const RichEditor = dynamic(() => import("@/components/shared/rich-editor").then((m) => m.RichEditor), { ssr: false, loading: () => <div className="input min-h-[220px] animate-pulse" /> });

/** Pestaña donde vive cada campo, para llevar al usuario al error en vez de a "Básico" siempre. */
const FIELD_TAB: Record<string, "basic" | "details" | "media" | "location" | "extra" | "i18n"> = {
  title: "basic", description: "basic", content: "basic", type: "basic", categoryId: "basic", price: "basic", currencyCode: "basic", period: "basic",
  area: "details", bedrooms: "details", bathrooms: "details", floors: "details", parking: "details", yearBuilt: "details", videoUrl: "details", projectId: "details", customValues: "details",
  images: "media", cityId: "location", address: "location", lat: "location", lng: "location", featureIds: "extra", facilities: "extra", translations: "i18n",
};

type Opt = { id: string; name: string };
export type PropertyFormOptions = {
  cities: (Opt & { state?: { name: string } | null })[]; categories: Opt[]; features: Opt[]; facilities: Opt[]; projects: Opt[]; currencies: { code: string; symbol: string }[];
  customFields: { id: string; name: string; type: string; options?: string | null }[]; agents?: { id: string; user: { name: string } }[]; users?: { id: string; name: string }[];
};

export type PropertyFormValues = {
  title: string; description: string; content: string; type: "SALE" | "RENT"; status: string; moderation: string; price: number | ""; currencyCode: string; period: string; area: number | ""; bedrooms: number | ""; bathrooms: number | ""; floors: number | ""; parking: number | ""; yearBuilt: number | "";
  address: string; lat: number | null; lng: number | null; videoUrl: string; isFeatured: boolean; cityId: string; categoryId: string; projectId: string; agentId: string; authorId: string;
  images: ImageItem[]; featureIds: string[]; facilities: { facilityId: string; distance: string }[]; customValues: { fieldId: string; value: string }[]; translations: { locale: string; field: string; value: string }[];
};


export function PropertyForm({ initial, id, options, mode, credits, costs, backHref }: { initial: PropertyFormValues; id?: string; options: PropertyFormOptions; mode: "admin" | "account"; credits?: number; costs?: { listing: number; featured: number }; backHref: string }) {
  const router = useRouter();
  const [v, setV] = useState<PropertyFormValues>(initial);
  const [tab, setTab] = useState<"basic" | "details" | "media" | "location" | "extra" | "i18n">("basic");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const set = <K extends keyof PropertyFormValues>(k: K, val: PropertyFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const num = (s: string) => (s === "" ? "" : Number(s));
  // Coste: al crear se cobra la publicación (+ destacar); al editar solo se cobra si se activa "destacar" por primera vez.
  const featuredCharge = v.isFeatured && !initial.isFeatured ? (costs?.featured ?? 2) : 0;
  const cost = useMemo(() => (mode !== "account" ? 0 : !id ? (costs?.listing ?? 1) + featuredCharge : featuredCharge), [mode, id, costs, featuredCharge]);
  const cityRef = useMemo(() => options.cities.find((c) => c.id === v.cityId), [options.cities, v.cityId]);

  useEffect(() => {
    if (cityRef && v.lat == null) {
      const c = cityRef as unknown as { lat?: number | null; lng?: number | null };
      if (c.lat != null && c.lng != null) setV((s) => ({ ...s, lat: c.lat!, lng: c.lng! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.cityId]);

  const submit = async (action: "save" | "exit" | "duplicate") => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...v, price: v.price === "" ? 0 : v.price, area: v.area === "" ? null : v.area, bedrooms: v.bedrooms === "" ? null : v.bedrooms, bathrooms: v.bathrooms === "" ? null : v.bathrooms, floors: v.floors === "" ? null : v.floors, parking: v.parking === "" ? null : v.parking, yearBuilt: v.yearBuilt === "" ? null : v.yearBuilt, projectId: v.projectId || null, agentId: v.agentId || null, cityId: v.cityId || null, categoryId: v.categoryId || null, authorId: v.authorId || undefined, moderation: mode === "admin" ? v.moderation : undefined };
      const r = id ? await apiPut<{ id: string; slug: string }>(`/api/v1/properties/${id}`, payload) : await apiPost<{ id: string; slug: string }>("/api/v1/properties", payload);
      toast.success(id ? "Propiedad actualizada" : "Propiedad creada");
      if (action === "duplicate") {
        const d = await apiPost<{ id: string }>(`/api/v1/properties/${r.data.id}/duplicate`);
        router.push(`${backHref}/${d.data.id}/editar`);
        return;
      }
      if (action === "exit" || !id) router.push(backHref);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        const first = Object.keys(err.details)[0];
        setTab(FIELD_TAB[first] ?? "basic");
        toast.error(`${(err as Error).message}: ${Object.values(err.details)[0]?.[0] ?? ""}`);
      } else toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { value: "basic" as const, label: "Básico" }, { value: "details" as const, label: "Detalles" }, { value: "media" as const, label: `Fotos (${v.images.length})` }, { value: "location" as const, label: "Ubicación" }, { value: "extra" as const, label: "Características" }, { value: "i18n" as const, label: "English" },
  ];
  const tr = (field: string) => v.translations.find((t) => t.locale === "en" && t.field === field)?.value ?? "";
  const setTr = (field: string, value: string) => set("translations", [...v.translations.filter((t) => !(t.locale === "en" && t.field === field)), { locale: "en", field, value }]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit("save"); }} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Tabs value={tab} onChange={setTab} items={tabs} variant="underline" />

        {tab === "basic" && (
          <div className="card space-y-4 p-5">
            <Field label="Título" required error={errors.title?.[0]}><input className="input text-base font-semibold" value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej. Apartamento con vista en El Poblado" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de operación" required>
                <div className="inline-flex w-full rounded-xl bg-muted p-1">
                  {(["SALE", "RENT"] as const).map((t) => (
                    <button type="button" key={t} onClick={() => set("type", t)} className={cn("flex-1 rounded-lg py-2 text-sm font-semibold transition", v.type === t ? "bg-elevated shadow text-ink" : "text-ink-soft")}>{STATUS_LABELS[t]}</button>
                  ))}
                </div>
              </Field>
              <Field label="Categoría" required error={errors.categoryId?.[0]}>
                <select className="input cursor-pointer" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">Selecciona</option>{options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Precio" required error={errors.price?.[0]} className="sm:col-span-1"><input type="number" min={0} className="input" value={v.price} onChange={(e) => set("price", num(e.target.value))} /></Field>
              <Field label="Moneda"><select className="input cursor-pointer" value={v.currencyCode} onChange={(e) => set("currencyCode", e.target.value)}>{options.currencies.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}</select></Field>
              {v.type === "RENT" && <Field label="Periodo"><select className="input cursor-pointer" value={v.period} onChange={(e) => set("period", e.target.value)}>{RENT_PERIODS.map((p) => <option key={p} value={p}>por {STATUS_LABELS[p]}</option>)}</select></Field>}
            </div>
            <Field label="Descripción corta" hint="Aparece en las tarjetas y en los resultados de búsqueda (máx. 600 caracteres)." error={errors.description?.[0]}>
              <textarea className="input min-h-[90px]" maxLength={600} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Contenido"><RichEditor value={v.content} onChange={(h) => set("content", h)} /></Field>
          </div>
        )}

        {tab === "details" && (
          <div className="card grid gap-4 p-5 sm:grid-cols-3">
            {([["area", "Área (m²)"], ["bedrooms", "Habitaciones"], ["bathrooms", "Baños"], ["parking", "Parqueaderos"], ["floors", "Pisos"], ["yearBuilt", "Año de construcción"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><input type="number" min={0} className="input" value={v[k]} onChange={(e) => set(k, num(e.target.value) as never)} /></Field>
            ))}
            <Field label="Video (YouTube)" className="sm:col-span-3"><input className="input" value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" /></Field>
            {options.projects.length > 0 && (
              <Field label="Proyecto (opcional)" className="sm:col-span-3"><select className="input cursor-pointer" value={v.projectId} onChange={(e) => set("projectId", e.target.value)}><option value="">Ninguno</option>{options.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            )}
            {options.customFields.length > 0 && (
              <div className="sm:col-span-3">
                <p className="label">Campos personalizados</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {options.customFields.map((cf) => {
                    const val = v.customValues.find((c) => c.fieldId === cf.id)?.value ?? "";
                    const setCv = (value: string) => set("customValues", [...v.customValues.filter((c) => c.fieldId !== cf.id), { fieldId: cf.id, value }]);
                    return (
                      <Field key={cf.id} label={cf.name}>
                        {cf.type === "SELECT" ? (
                          <select className="input cursor-pointer" value={val} onChange={(e) => setCv(e.target.value)}><option value="">—</option>{(cf.options ?? "").split(",").filter(Boolean).map((o) => <option key={o} value={o.trim()}>{o.trim()}</option>)}</select>
                        ) : cf.type === "CHECKBOX" ? (
                          <Switch checked={val === "true"} onChange={(b) => setCv(b ? "true" : "")} label={val === "true" ? "Sí" : "No"} />
                        ) : (
                          <input type={cf.type === "NUMBER" ? "number" : "text"} className="input" value={val} onChange={(e) => setCv(e.target.value)} />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "media" && (
          <div className="card p-5"><ImageUploader value={v.images} onChange={(im) => set("images", im)} /></div>
        )}

        {tab === "location" && (
          <div className="card space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ciudad" required error={errors.cityId?.[0]}>
                <select className="input cursor-pointer" value={v.cityId} onChange={(e) => set("cityId", e.target.value)}><option value="">Selecciona</option>{options.cities.map((c) => <option key={c.id} value={c.id}>{c.name}{c.state ? `, ${c.state.name}` : ""}</option>)}</select>
              </Field>
              <Field label="Dirección"><input className="input" value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="Calle, barrio…" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitud"><input type="number" step="any" className="input" value={v.lat ?? ""} onChange={(e) => set("lat", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="Longitud"><input type="number" step="any" className="input" value={v.lng ?? ""} onChange={(e) => set("lng", e.target.value === "" ? null : Number(e.target.value))} /></Field>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Info className="h-3.5 w-3.5" /> Haz clic en el mapa o arrastra el marcador para fijar la ubicación exacta.</p>
            <MapPicker lat={v.lat} lng={v.lng} onChange={(la, ln) => setV((s) => ({ ...s, lat: la, lng: ln }))} />
          </div>
        )}

        {tab === "extra" && (
          <div className="card space-y-6 p-5">
            <div>
              <p className="label">Características</p>
              <div className="flex flex-wrap gap-2">
                {options.features.map((f) => {
                  const on = v.featureIds.includes(f.id);
                  return <button type="button" key={f.id} onClick={() => set("featureIds", on ? v.featureIds.filter((x) => x !== f.id) : [...v.featureIds, f.id])} className={cn("chip border transition", on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated text-ink-soft hover:border-brand")}>{f.name}</button>;
                })}
              </div>
            </div>
            <div>
              <p className="label">Lugares cercanos</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.facilities.map((f) => {
                  const cur = v.facilities.find((x) => x.facilityId === f.id);
                  return (
                    <label key={f.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition", cur ? "border-brand bg-brand-soft/40" : "border-line")}>
                      <input type="checkbox" className="h-4 w-4 accent-brand" checked={!!cur} onChange={(e) => set("facilities", e.target.checked ? [...v.facilities, { facilityId: f.id, distance: "" }] : v.facilities.filter((x) => x.facilityId !== f.id))} />
                      <span className="flex-1">{f.name}</span>
                      {cur && <input className="input w-24 py-1 text-xs" placeholder="500 m" value={cur.distance} onChange={(e) => set("facilities", v.facilities.map((x) => (x.facilityId === f.id ? { ...x, distance: e.target.value } : x)))} />}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "i18n" && (
          <div className="card space-y-4 p-5">
            <p className="text-sm text-ink-soft">Traducción al inglés (opcional). Si se deja vacío se muestra el contenido en español.</p>
            <Field label="Title"><input className="input" value={tr("title")} onChange={(e) => setTr("title", e.target.value)} /></Field>
            <Field label="Short description"><textarea className="input min-h-[90px]" value={tr("description")} onChange={(e) => setTr("description", e.target.value)} /></Field>
            <Field label="Content"><RichEditor value={tr("content")} onChange={(h) => setTr("content", h)} minHeight={160} /></Field>
          </div>
        )}
      </div>

      {/* Panel Publicar */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h3 className="mb-3 font-display font-bold">Publicar</h3>
          <div className="grid gap-2">
            <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Spinner /> : <Save className="h-4 w-4" />} Guardar</button>
            <button type="button" disabled={saving} onClick={() => submit("exit")} className="btn-outline w-full"><LogOut className="h-4 w-4" /> Guardar y salir</button>
            {id && <button type="button" disabled={saving} onClick={() => submit("duplicate")} className="btn-ghost w-full"><Copy className="h-4 w-4" /> Duplicar</button>}
          </div>
          {mode === "account" && (
            <div className="mt-4 rounded-xl bg-muted p-3 text-xs text-ink-soft">
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-accent" /> Tus créditos</span><b className="text-ink">{credits ?? 0}</b></p>
              {cost > 0 && <p className="mt-1 flex items-center justify-between"><span>{id ? "Costo de destacar" : "Costo de esta publicación"}</span><b className={cn(cost > (credits ?? 0) ? "text-danger" : "text-ink")}>{cost}</b></p>}
              {cost > (credits ?? 0) && <Link href="/cuenta/creditos" className="mt-2 block font-semibold text-brand hover:underline">Comprar créditos →</Link>}
            </div>
          )}
        </div>
        <div className="card space-y-4 p-5">
          <Switch checked={v.isFeatured} onChange={(b) => set("isFeatured", b)} label="Destacar propiedad" />
          {mode === "account" && featuredCharge > 0 && <p className="-mt-2 flex items-center gap-1 text-xs text-ink-muted"><Sparkles className="h-3 w-3 text-accent" /> +{featuredCharge} créditos</p>}
          <Field label="Estado"><select className="input cursor-pointer" value={v.status} onChange={(e) => set("status", e.target.value)}>{PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field>
          {mode === "admin" && (
            <>
              <Field label="Moderación"><select className="input cursor-pointer" value={v.moderation} onChange={(e) => set("moderation", e.target.value)}>{MODERATION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field>
              {options.agents && <Field label="Agente"><select className="input cursor-pointer" value={v.agentId} onChange={(e) => set("agentId", e.target.value)}><option value="">Sin asignar</option>{options.agents.map((a) => <option key={a.id} value={a.id}>{a.user.name}</option>)}</select></Field>}
              {options.users && !id && <Field label="Autor (propietario)"><select className="input cursor-pointer" value={v.authorId} onChange={(e) => set("authorId", e.target.value)}><option value="">Yo (admin)</option>{options.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
            </>
          )}
        </div>
      </aside>
    </form>
  );
}

