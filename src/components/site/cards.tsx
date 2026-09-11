"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, Calendar, MapPin, Phone, Layers, Home } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Price } from "@/components/site/price";
import { formatDate, stripHtml, truncate, cn } from "@/lib/utils";

export type ProjectCardData = {
  id: string; slug: string; name: string; description?: string | null; status: string; priceFrom?: number | null; priceTo?: number | null; currencyCode: string; units?: number | null; floors?: number | null;
  images: { url: string }[]; city?: { name: string; state?: { name: string } | null } | null; investor?: { name: string } | null; _count?: { properties: number };
};

export function ProjectCard({ p, className, large }: { p: ProjectCardData; className?: string; large?: boolean }) {
  return (
    <article className={cn("group relative overflow-hidden rounded-3xl bg-ink text-white shadow-[var(--shadow-md)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]", large ? "aspect-[4/5] sm:aspect-[16/10]" : "aspect-[4/5]", className)}>
      <Link href={`/proyectos/${p.slug}`} className="absolute inset-0">
        <SmartImage src={p.images[0]?.url} alt={p.name} className="h-full w-full transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      </Link>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <StatusBadge value={p.status} className="bg-white/95" />
        {p.investor && <span className="chip bg-black/40 text-white backdrop-blur">{p.investor.name}</span>}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        {p.city && <p className="mb-1 inline-flex items-center gap-1 text-xs text-white/80"><MapPin className="h-3 w-3" /> {p.city.name}</p>}
        <h3 className={cn("font-display font-extrabold leading-tight", large ? "text-2xl sm:text-3xl" : "text-xl")}>{p.name}</h3>
        {p.priceFrom != null && (
          <p className="mt-2 text-sm text-white/85">
            Desde <Price amount={p.priceFrom} currencyCode={p.currencyCode} className="text-lg text-white" />
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/80">
          {p.units != null && <span className="inline-flex items-center gap-1"><Home className="h-3.5 w-3.5" /> {p.units} unidades</span>}
          {p.floors != null && <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {p.floors} pisos</span>}
          {p._count && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {p._count.properties} disponibles</span>}
        </div>
      </div>
      <span className="pointer-events-none absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
        <ArrowUpRight className="h-5 w-5" />
      </span>
    </article>
  );
}

export type AgentCardData = {
  id: string; slug: string; title?: string | null; agency?: string | null; whatsapp?: string | null;
  user: { name: string; avatarUrl?: string | null; phone?: string | null; email?: string | null };
  city?: { name: string } | null; _count?: { properties: number };
};

export function AgentCard({ a, className }: { a: AgentCardData; className?: string }) {
  return (
    <article className={cn("card group flex flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]", className)}>
      <Link href={`/agentes/${a.slug}`}>
        <Avatar src={a.user.avatarUrl} name={a.user.name} size="xl" className="ring-4 ring-brand-soft" />
      </Link>
      <h3 className="mt-4 font-display text-lg font-bold">
        <Link href={`/agentes/${a.slug}`} className="hover:text-brand">{a.user.name}</Link>
      </h3>
      <p className="text-sm text-brand">{a.title ?? "Asesor inmobiliario"}</p>
      {a.agency && <p className="mt-0.5 text-xs text-ink-muted">{a.agency}{a.city ? ` · ${a.city.name}` : ""}</p>}
      {a._count && <p className="mt-3 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-ink-soft">{a._count.properties} propiedades</p>}
      <div className="mt-4 flex gap-2">
        <Link href={`/agentes/${a.slug}`} className="btn-outline px-4 py-2 text-xs">Ver perfil</Link>
        {a.whatsapp && (
          <a href={`https://wa.me/${a.whatsapp}`} target="_blank" rel="noreferrer" className="btn-primary px-4 py-2 text-xs"><Phone className="h-3.5 w-3.5" /> WhatsApp</a>
        )}
      </div>
    </article>
  );
}

export type PostCardData = { id: string; slug: string; title: string; excerpt?: string | null; content?: string | null; coverUrl?: string | null; publishedAt?: string | Date | null; category?: { name: string } | null; author?: { name: string; avatarUrl?: string | null } | null };

export function PostCard({ p, className, horizontal }: { p: PostCardData; className?: string; horizontal?: boolean }) {
  return (
    <article className={cn("group card overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]", horizontal && "sm:flex", className)}>
      <Link href={`/noticias/${p.slug}`} className={cn("block aspect-[16/10] overflow-hidden", horizontal && "sm:w-2/5 sm:aspect-auto")}>
        <SmartImage src={p.coverUrl} alt={p.title} className="h-full w-full transition duration-700 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
          {p.category && <span className="chip bg-brand-soft text-brand-strong">{p.category.name}</span>}
          {p.publishedAt && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(p.publishedAt)}</span>}
        </div>
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link href={`/noticias/${p.slug}`} className="hover:text-brand">{p.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{p.excerpt ?? truncate(stripHtml(p.content), 140)}</p>
        {p.author && (
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
            <Avatar src={p.author.avatarUrl} name={p.author.name} size="sm" className="h-6 w-6 text-[10px]" /> {p.author.name}
          </div>
        )}
      </div>
    </article>
  );
}

export function CityCard({ c, className }: { c: { slug: string; name: string; imageUrl?: string | null; state?: { name: string } | null; _count?: { properties: number } }; className?: string }) {
  return (
    <Link href={`/propiedades?city=${c.slug}`} className={cn("group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-ink text-white", className)}>
      <SmartImage src={c.imageUrl} alt={c.name} className="h-full w-full transition duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-xl font-extrabold">{c.name}</h3>
        <p className="text-xs text-white/80">{c.state?.name}{c._count ? ` · ${c._count.properties} propiedades` : ""}</p>
      </div>
    </Link>
  );
}
