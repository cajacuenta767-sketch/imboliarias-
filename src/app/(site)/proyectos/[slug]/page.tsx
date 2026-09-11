import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Layers, Home, CalendarCheck, Building2, Check, Navigation } from "lucide-react";
import { Gallery } from "@/components/site/gallery";
import { InquiryForm } from "@/components/site/forms";
import { PropertyGrid } from "@/components/site/property-card";
import { Price } from "@/components/site/price";
import { StatusBadge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/misc";
import { ProjectMap } from "@/components/site/project-map";
import { getProjectBySlug } from "@/server/modules/projects/service";
import { HttpError } from "@/server/errors";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const load = cache(async (slug: string) => {
  try {
    return await getProjectBySlug(slug, true);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  return { title: p?.name ?? "Proyecto", description: p?.description ?? undefined };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  return (
    <div className="container-x py-8">
      <nav className="mb-4 text-xs text-ink-muted"><Link href="/" className="hover:text-brand">Inicio</Link> / <Link href="/proyectos" className="hover:text-brand">Proyectos</Link> / <span className="text-ink">{p.name}</span></nav>
      <Gallery images={p.images} title={p.name} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge value={p.status} />{p.category && <span className="chip bg-muted text-ink-soft">{p.category.name}</span>}{p.investor && <span className="chip bg-muted text-ink-soft">{p.investor.name}</span>}</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{p.name}</h1>
          {p.city && <p className="mt-2 inline-flex items-center gap-1 text-sm text-ink-soft"><MapPin className="h-4 w-4 text-brand" /> {p.address ?? `${p.city.name}, ${p.city.state.name}`}</p>}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[[Home, p.units, "Unidades"], [Layers, p.floors, "Pisos"], [CalendarCheck, p.finishAt ? formatDate(p.finishAt) : null, "Entrega"], [Building2, p._count.properties, "Disponibles"]].map(([Icon, v, l], i) => v ? (
              <div key={i} className="card flex items-center gap-3 p-4">
                {(() => { const I = Icon as React.ComponentType<{ className?: string }>; return <I className="h-6 w-6 text-brand" />; })()}
                <div><p className="font-display text-lg font-bold">{v as React.ReactNode}</p><p className="text-xs text-ink-muted">{l as string}</p></div>
              </div>
            ) : null)}
          </div>
          {p.description && <p className="mt-8 text-lg leading-relaxed">{p.description}</p>}
          <div className="prose-content mt-4" dangerouslySetInnerHTML={{ __html: p.content ?? "" }} />
          {p.features.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 font-display text-xl font-bold">Amenidades</h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {p.features.map((f) => (
                  <li key={f.featureId} className="flex items-center gap-2.5 rounded-xl bg-elevated px-3.5 py-2.5 text-sm ring-1 ring-line"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand"><Check className="h-3.5 w-3.5" /></span>{f.feature.name}</li>
                ))}
              </ul>
            </div>
          )}
          {p.facilities.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 font-display text-xl font-bold">Cerca del proyecto</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.facilities.map((f) => (
                  <li key={f.facilityId} className="flex items-center justify-between rounded-xl bg-elevated px-4 py-3 text-sm ring-1 ring-line"><span className="inline-flex items-center gap-2"><Navigation className="h-4 w-4 text-brand" /> {f.facility.name}</span><span className="text-ink-muted">{f.distance}</span></li>
                ))}
              </ul>
            </div>
          )}
          {p.lat != null && p.lng != null && (
            <div className="mt-10">
              <h2 className="mb-4 font-display text-xl font-bold">Ubicación</h2>
              <ProjectMap lat={p.lat} lng={p.lng} name={p.name} slug={p.slug} />
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Precios desde</p>
            {p.priceFrom != null && <Price amount={p.priceFrom} currencyCode={p.currencyCode} className="text-3xl text-brand-strong" />}
            {p.priceTo != null && <p className="text-sm text-ink-muted">hasta <Price amount={p.priceTo} currencyCode={p.currencyCode} className="text-sm text-ink" /></p>}
            <div className="mt-5 border-t border-line pt-5">
              <h3 className="mb-3 font-display font-bold">Quiero más información</h3>
              <InquiryForm projectId={p.id} defaultMessage={`Hola, me interesa el proyecto ${p.name}. ¿Me pueden enviar más información?`} compact />
            </div>
          </div>
        </aside>
      </div>
      {p.properties.length > 0 && (
        <section className="mt-20">
          <SectionHeader title="Unidades disponibles" href={`/propiedades?project=${p.slug}`} />
          <PropertyGrid items={p.properties} />
        </section>
      )}
    </div>
  );
}
