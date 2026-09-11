"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Check, MapPin, Play, Share2, Eye, Calendar, Hash, Building2, Maximize2, BedDouble, Bath, Car, Layers, CalendarClock, Tag, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Gallery } from "@/components/site/gallery";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { WishlistButton } from "@/components/site/wishlist-button";
import { Stars } from "@/components/ui/stars";
import { formatDate, youtubeEmbed, cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";
import type { PropertyFull } from "@/server/modules/properties/service";

const MapView = dynamic(() => import("@/components/site/map-view").then((m) => m.MapView), { ssr: false });

type Tab = "overview" | "details" | "features" | "nearby" | "location" | "video" | "reviews";

export function PropertyDetail({ p, rating, children }: { p: PropertyFull; rating: { avg: number; count: number }; children?: React.ReactNode }) {
  const t = useTranslations("property");
  const [tab, setTab] = useState<Tab>("overview");
  const [video, setVideo] = useState(false);
  const embed = youtubeEmbed(p.videoUrl);
  const cityLabel = p.city ? `${p.city.name}, ${p.city.state.name}` : p.address;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: p.title, url }).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  };

  const details: [string, React.ReactNode, React.ComponentType<{ className?: string }>][] = [
    [t("code"), p.uniqueId, Hash],
    [t("type"), STATUS_LABELS[p.type], Tag],
    [t("category"), p.category?.name, Building2],
    [t("areaLabel"), p.area ? `${p.area} m²` : null, Maximize2],
    [t("bedroomsLabel"), p.bedrooms, BedDouble],
    [t("bathroomsLabel"), p.bathrooms, Bath],
    [t("parking"), p.parking, Car],
    [t("floors"), p.floors, Layers],
    [t("yearBuilt"), p.yearBuilt, CalendarClock],
    [t("status"), STATUS_LABELS[p.status], Check],
    ...p.customValues.map((c) => [c.field.name, c.value, Tag] as [string, React.ReactNode, React.ComponentType<{ className?: string }>]),
  ];

  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: t("overview") },
    { value: "details", label: t("details") },
    { value: "features", label: t("features") },
    { value: "nearby", label: t("nearby") },
    { value: "location", label: t("location") },
    ...(embed ? [{ value: "video" as Tab, label: t("video") }] : []),
    { value: "reviews", label: `${t("reviews")} (${rating.count})` },
  ];

  return (
    <>
      <Gallery images={p.images} title={p.title} hasVideo={!!embed} onVideo={() => setVideo(true)} onMap={() => setTab("location")} />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn("chip", p.type === "SALE" ? "bg-brand-soft text-brand-strong" : "bg-rent-soft text-rent")}>{STATUS_LABELS[p.type]}</span>
            {p.category && <span className="chip bg-muted text-ink-soft">{p.category.name}</span>}
            {p.isFeatured && <span className="chip bg-accent-soft text-accent-strong">Destacada</span>}
            {rating.count > 0 && <Stars value={rating.avg} count={rating.count} />}
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{p.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            {cityLabel && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-brand" /> {cityLabel}</span>}
            <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {p.views.toLocaleString("es-CO")} {t("views")}</span>
            {p.publishedAt && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {t("published")} {formatDate(p.publishedAt)}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={share} className="btn-outline"><Share2 className="h-4 w-4" /> {t("share")}</button>
          <WishlistButton propertyId={p.id} withLabel />
        </div>
      </div>

      <div className="mt-8">
        <Tabs value={tab} onChange={setTab} items={tabs} variant="underline" />
        <div className="py-6">
          {tab === "overview" && (
            <div className="space-y-6">
              {p.description && <p className="text-lg leading-relaxed text-ink">{p.description}</p>}
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: p.content ?? "" }} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  [BedDouble, p.bedrooms, t("bedroomsLabel")],
                  [Bath, p.bathrooms, t("bathroomsLabel")],
                  [Maximize2, p.area ? `${p.area} m²` : null, t("areaLabel")],
                  [Car, p.parking, t("parking")],
                ].map(([Icon, v, l], i) => v ? (
                  <div key={i} className="card flex items-center gap-3 p-4">
                    {(() => { const I = Icon as React.ComponentType<{ className?: string }>; return <I className="h-6 w-6 text-brand" />; })()}
                    <div><p className="font-display text-lg font-bold">{v as React.ReactNode}</p><p className="text-xs text-ink-muted">{l as string}</p></div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
          {tab === "details" && (
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {details.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v, Icon]) => (
                <div key={k} className="flex items-center justify-between border-b border-line py-2.5 text-sm">
                  <dt className="inline-flex items-center gap-2 text-ink-soft"><Icon className="h-4 w-4 text-brand" /> {k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === "features" && (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {p.features.map((f) => (
                <li key={f.featureId} className="flex items-center gap-2.5 rounded-xl bg-elevated px-3.5 py-2.5 text-sm ring-1 ring-line">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand"><Check className="h-3.5 w-3.5" /></span>
                  {f.feature.name}
                </li>
              ))}
              {p.features.length === 0 && <li className="text-sm text-ink-muted">Sin características registradas.</li>}
            </ul>
          )}
          {tab === "nearby" && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {p.facilities.map((f) => (
                <li key={f.facilityId} className="flex items-center justify-between rounded-xl bg-elevated px-4 py-3 text-sm ring-1 ring-line">
                  <span className="inline-flex items-center gap-2"><Navigation className="h-4 w-4 text-brand" /> {f.facility.name}</span>
                  <span className="text-ink-muted">{f.distance}</span>
                </li>
              ))}
              {p.facilities.length === 0 && <li className="text-sm text-ink-muted">Sin lugares cercanos registrados.</li>}
            </ul>
          )}
          {tab === "location" && (
            <div className="space-y-3">
              {p.address && <p className="text-sm text-ink-soft"><MapPin className="mr-1 inline h-4 w-4 text-brand" /> {p.address}</p>}
              <div className="h-[380px] overflow-hidden rounded-3xl border border-line">
                {p.lat != null && p.lng != null ? (
                  <MapView single points={[{ id: p.id, slug: p.slug, title: p.title, price: p.price, currencyCode: p.currencyCode, type: p.type, lat: p.lat, lng: p.lng }]} center={[p.lat, p.lng]} zoom={15} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink-muted">Ubicación no disponible</div>
                )}
              </div>
            </div>
          )}
          {tab === "video" && embed && (
            <div className="aspect-video overflow-hidden rounded-3xl bg-black">
              <iframe src={embed} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
            </div>
          )}
          {tab === "reviews" && <div className="space-y-4">{children}</div>}
        </div>
      </div>

      <Modal open={video} onClose={() => setVideo(false)} size="xl">
        {embed && (
          <div className="aspect-video bg-black">
            <iframe src={`${embed}?autoplay=1`} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen title="Video" />
          </div>
        )}
      </Modal>
      <span className="hidden"><Play /></span>
    </>
  );
}
