"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BedDouble, Bath, Maximize2, MapPin, Camera, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Avatar } from "@/components/ui/avatar";
import { Price } from "@/components/site/price";
import { WishlistButton } from "@/components/site/wishlist-button";
import { cn } from "@/lib/utils";

export type PropertyCardData = {
  id: string;
  slug: string;
  title: string;
  type: string;
  price: number;
  currencyCode: string;
  period?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  isFeatured?: boolean;
  createdAt?: string | Date;
  images: { url: string; alt?: string | null }[];
  city?: { name: string; state?: { name: string } | null } | null;
  category?: { name: string } | null;
  agent?: { user: { name: string; avatarUrl?: string | null } } | null;
  _count?: { images: number };
};

export function PropertyCard({ p, layout = "grid", className, hideAgent }: { p: PropertyCardData; layout?: "grid" | "list"; className?: string; hideAgent?: boolean }) {
  const t = useTranslations("common");
  const isNew = p.createdAt && Date.now() - new Date(p.createdAt).getTime() < 7 * 86400000;
  const photos = p._count?.images ?? p.images.length;
  const list = layout === "list";
  return (
    <article className={cn("group card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]", list && "sm:flex", className)}>
      <Link href={`/propiedades/${p.slug}`} className={cn("relative block aspect-[4/3] overflow-hidden", list && "sm:w-2/5 sm:aspect-auto sm:min-h-[220px]")}>
        <SmartImage src={p.images[0]?.url} alt={p.images[0]?.alt ?? p.title} className="h-full w-full transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className={cn("chip backdrop-blur", p.type === "SALE" ? "bg-white/95 text-brand-strong" : "bg-white/95 text-rent")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", p.type === "SALE" ? "bg-brand" : "bg-rent")} />
            {p.type === "SALE" ? t("sale") : t("rent")}
          </span>
          {p.isFeatured && <span className="chip bg-accent text-white"><Sparkles className="h-3 w-3" /> {t("featured")}</span>}
          {isNew && !p.isFeatured && <span className="chip bg-ink/80 text-white backdrop-blur">{t("new")}</span>}
        </div>
        <div className="absolute right-3 top-3">
          <WishlistButton propertyId={p.id} />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <Price amount={p.price} currencyCode={p.currencyCode} period={p.period} type={p.type} className="text-xl drop-shadow" />
          <span className="chip bg-black/40 text-white backdrop-blur"><Camera className="h-3 w-3" /> {photos}</span>
        </div>
      </Link>
      <div className={cn("flex flex-1 flex-col p-4", list && "sm:p-5")}>
        {p.category && <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand">{p.category.name}</p>}
        <h3 className="font-display text-base font-bold leading-snug text-ink">
          <Link href={`/propiedades/${p.slug}`} className="line-clamp-2 hover:text-brand">{p.title}</Link>
        </h3>
        {p.city && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5 text-ink-muted" /> {p.city.name}{p.city.state ? `, ${p.city.state.name}` : ""}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-sm text-ink-soft">
          {p.bedrooms != null && p.bedrooms > 0 && <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-ink-muted" /> {p.bedrooms} <span className="text-ink-muted">{t("bedrooms")}</span></span>}
          {p.bathrooms != null && p.bathrooms > 0 && <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4 text-ink-muted" /> {p.bathrooms} <span className="text-ink-muted">{t("bathrooms")}</span></span>}
          {p.area != null && p.area > 0 && <span className="inline-flex items-center gap-1.5"><Maximize2 className="h-4 w-4 text-ink-muted" /> {p.area} {t("area")}</span>}
        </div>
        {!hideAgent && p.agent && (
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            <Avatar src={p.agent.user.avatarUrl} name={p.agent.user.name} size="sm" className="h-6 w-6 text-[10px]" />
            <span className="truncate">{p.agent.user.name}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export function PropertyGrid({ items, layout = "grid", cols = 4, hideAgent }: { items: PropertyCardData[]; layout?: "grid" | "list"; cols?: 2 | 3 | 4; hideAgent?: boolean }) {
  const colCls = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }[cols];
  return (
    <div className={cn("grid gap-5", layout === "grid" ? colCls : "grid-cols-1")}>
      {items.map((p, i) => (
        <PropertyCard key={p.id} p={p} layout={layout} hideAgent={hideAgent} className={i < 8 ? "animate-fade-up" : undefined} />
      ))}
    </div>
  );
}
