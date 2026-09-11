"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid, List, Map as MapIcon, SlidersHorizontal, X, Search } from "lucide-react";
import { PropertyGrid, type PropertyCardData } from "@/components/site/property-card";
import { Pagination } from "@/components/ui/pagination";
import { Sheet } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MapPoint } from "@/components/site/map-view";

const MapView = dynamic(() => import("@/components/site/map-view").then((m) => m.MapView), { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted" /> });

type Opt = { id: string; name: string; slug: string };
type Meta = { page: number; perPage: number; total: number; totalPages: number };

export function FiltersForm({ cities, categories, features, onDone, inline }: { cities: Opt[]; categories: Opt[]; features: { id: string; name: string }[]; onDone?: () => void; inline?: boolean }) {
  const t = useTranslations("list");
  const tc = useTranslations("common");
  const th = useTranslations("hero");
  const tp = useTranslations("property");
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = (k: string) => sp.get(k) ?? "";
  const fromParams = useCallback(() => ({
    q: get("q"), type: get("type"), city: get("city"), category: get("category"), minPrice: get("minPrice"), maxPrice: get("maxPrice"),
    minArea: get("minArea"), maxArea: get("maxArea"), bedrooms: get("bedrooms"), bathrooms: get("bathrooms"), features: (get("features") ? get("features").split(",") : []) as string[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [sp]);
  const [f, setF] = useState(fromParams);
  // Si la URL cambia desde fuera (chips del inicio, "limpiar", navegación), el formulario se resincroniza.
  useEffect(() => { setF(fromParams()); }, [fromParams]);
  const apply = () => {
    const n = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length) n.set(k, v.join(","));
      } else if (v) n.set(k, v);
    });
    const sort = sp.get("sort");
    if (sort) n.set("sort", sort);
    const view = sp.get("view");
    if (view) n.set("view", view);
    router.push(`${pathname}?${n.toString()}`);
    onDone?.();
  };
  const clear = () => {
    router.push(pathname);
    onDone?.();
  };
  const sel = "input cursor-pointer";
  return (
    <div className={cn("space-y-4", inline && "grid gap-3 space-y-0 md:grid-cols-2 xl:grid-cols-6")}>
      <label className={cn("block", inline && "xl:col-span-2")}>
        <span className="label">{th("keyword").split("?")[0]}</span>
        <span className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder={th("keyword")} onKeyDown={(e) => e.key === "Enter" && apply()} />
        </span>
      </label>
      <label className="block">
        <span className="label">{tc("sale")} / {tc("rent")}</span>
        <select className={sel} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="">{t("any")}</option>
          <option value="SALE">{tc("sale")}</option>
          <option value="RENT">{tc("rent")}</option>
        </select>
      </label>
      <label className="block">
        <span className="label">{th("city")}</span>
        <select className={sel} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
          <option value="">{th("anyCity")}</option>
          {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">{th("category")}</span>
        <select className={sel} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">{th("anyCategory")}</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <div className={cn("grid grid-cols-2 gap-2", inline && "xl:col-span-1")}>
        <label className="block"><span className="label">{t("priceMin")}</span><input type="number" className="input" value={f.minPrice} onChange={(e) => setF({ ...f, minPrice: e.target.value })} placeholder="0" /></label>
        <label className="block"><span className="label">{t("priceMax")}</span><input type="number" className="input" value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value })} placeholder="∞" /></label>
      </div>
      {!inline && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="label">{t("areaMin")}</span><input type="number" className="input" value={f.minArea} onChange={(e) => setF({ ...f, minArea: e.target.value })} /></label>
            <label className="block"><span className="label">{t("areaMax")}</span><input type="number" className="input" value={f.maxArea} onChange={(e) => setF({ ...f, maxArea: e.target.value })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="label">{t("bedrooms")}</span>
              <select className={sel} value={f.bedrooms} onChange={(e) => setF({ ...f, bedrooms: e.target.value })}>
                <option value="">{t("any")}</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">{t("bathrooms")}</span>
              <select className={sel} value={f.bathrooms} onChange={(e) => setF({ ...f, bathrooms: e.target.value })}>
                <option value="">{t("any")}</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
          </div>
          <div>
            <span className="label">{tp("features")}</span>
            <div className="flex flex-wrap gap-1.5">
              {features.map((ft) => {
                const on = f.features.includes(ft.id);
                return (
                  <button key={ft.id} type="button" onClick={() => setF({ ...f, features: on ? f.features.filter((x) => x !== ft.id) : [...f.features, ft.id] })} className={cn("chip border transition", on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated text-ink-soft hover:border-brand")}>
                    {ft.name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      <div className={cn("flex gap-2", inline && "items-end")}>
        <button type="button" onClick={apply} className="btn-primary flex-1">{tc("apply")}</button>
        <button type="button" onClick={clear} className="btn-ghost" title={tc("clearFilters")} aria-label={tc("clearFilters")}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function PropertyListing({ items, meta, cities, categories, features, mapQuery }: { items: PropertyCardData[]; meta: Meta; cities: Opt[]; categories: Opt[]; features: { id: string; name: string }[]; mapQuery: string }) {
  const t = useTranslations("list");
  const tc = useTranslations("common");
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = (sp.get("view") as "grid" | "list" | "map") ?? "grid";
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [mobileMap, setMobileMap] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);

  const setParam = useCallback(
    (k: string, v: string) => {
      const n = new URLSearchParams(sp.toString());
      if (v) n.set(k, v);
      else n.delete(k);
      if (k !== "page") n.delete("page");
      router.push(`${pathname}?${n.toString()}`);
    },
    [sp, router, pathname],
  );

  useEffect(() => {
    if (view !== "map" && !mobileMap) return;
    // AbortController: una respuesta lenta anterior no pisa a la más reciente al mover filtros/mapa rápido.
    const ctrl = new AbortController();
    setPointsLoading(true);
    fetch(`/api/v1/properties/map?${mapQuery}`, { signal: ctrl.signal })
      .then(async (r) => {
        const j = (await r.json().catch(() => null)) as { data?: MapPoint[]; error?: string } | null;
        if (!r.ok) throw new Error(j?.error ?? "Error");
        setPoints(j?.data ?? []);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setPoints([]);
        toast.error(tc("mapError"));
      })
      .finally(() => { if (!ctrl.signal.aborted) setPointsLoading(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, mobileMap, mapQuery]);

  const activeFilters = useMemo(() => ["q", "type", "city", "category", "minPrice", "maxPrice", "minArea", "maxArea", "bedrooms", "bathrooms", "features"].filter((k) => sp.get(k)).length, [sp]);

  const toolbar = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-soft">
        <span className="font-bold text-ink">{meta.total}</span> {tc("results")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setOpen(true)} className="btn-outline py-2 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> {tc("filters")} {activeFilters > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">{activeFilters}</span>}
        </button>
        <select className="input w-auto cursor-pointer py-2" aria-label={tc("sortLabel")} value={sp.get("sort") ?? "newest"} onChange={(e) => setParam("sort", e.target.value)}>
          {(["newest", "price_asc", "price_desc", "area_desc", "views"] as const).map((k) => (
            <option key={k} value={k}>{t(`sort.${k}`)}</option>
          ))}
        </select>
        <div className="inline-flex rounded-full bg-muted p-1" role="group" aria-label={tc("viewGrid").split(" ")[0]}>
          {([["grid", LayoutGrid, tc("viewGrid")], ["list", List, tc("viewList")], ["map", MapIcon, tc("viewMap")]] as const).map(([v, Icon, label]) => (
            <button key={v} onClick={() => setParam("view", v)} className={cn("rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50", view === v ? "bg-elevated shadow text-brand" : "text-ink-soft hover:text-ink")} aria-label={label} aria-pressed={view === v}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const content = items.length === 0 ? (
    <EmptyState title={tc("noResults")} action={<button onClick={() => router.push(pathname)} className="btn-outline">{tc("clearFilters")}</button>} />
  ) : (
    <>
      <PropertyGrid items={items} layout={view === "list" ? "list" : "grid"} cols={view === "map" ? 2 : 3} />
      <Pagination page={meta.page} totalPages={meta.totalPages} className="mt-10" />
    </>
  );

  return (
    <>
      <Sheet open={open} onClose={() => setOpen(false)} title={tc("filters")}>
        <FiltersForm cities={cities} categories={categories} features={features} onDone={() => setOpen(false)} />
      </Sheet>
      {view === "map" ? (
        <div className="grid gap-5 pb-24 lg:grid-cols-[1fr_1fr] lg:pb-0 xl:grid-cols-[1.1fr_1fr]">
          <div className={cn(mobileMap && "hidden lg:block")}>
            {toolbar}
            <div className="lg:max-h-[calc(100dvh-180px)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">{content}</div>
          </div>
          <div className={cn("relative sticky top-24 h-[65dvh] overflow-hidden rounded-3xl border border-line lg:h-[calc(100dvh-130px)]", !mobileMap && "hidden lg:block")}>
            {pointsLoading && <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-elevated px-3 py-1 text-xs font-semibold shadow" role="status">{tc("loading")}</div>}
            <MapView points={points} onBoundsChange={(bbox) => setParam("bbox", bbox)} labels={{ perMonth: tc("perMonth"), bedrooms: tc("bedrooms"), bathrooms: tc("bathrooms") }} />
          </div>
          <button onClick={() => setMobileMap((m) => !m)} className="btn-dark fixed bottom-24 left-1/2 z-30 -translate-x-1/2 lg:hidden" aria-pressed={mobileMap}>
            {mobileMap ? <><List className="h-4 w-4" /> {tc("list")}</> : <><MapIcon className="h-4 w-4" /> {tc("map")}</>}
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
          <aside className="hidden lg:block">
            <div className="card sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto p-5 scrollbar-thin">
              <h3 className="mb-4 font-display text-lg font-bold">{tc("filters")}</h3>
              <FiltersForm cities={cities} categories={categories} features={features} />
            </div>
          </aside>
          <div>
            {toolbar}
            {content}
          </div>
        </div>
      )}
    </>
  );
}
