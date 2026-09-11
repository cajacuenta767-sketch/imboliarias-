import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { listCareers } from "@/server/modules/careers/service";
import { EmptyState } from "@/components/ui/misc";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Empleos" };

export default async function CareersPage() {
  const careers = await listCareers(true);
  return (
    <div className="container-x py-10">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow mb-2">Trabaja con nosotros</p>
        <h1 className="section-title">Vacantes abiertas</h1>
        <p className="mt-2 text-ink-soft">Únete a un equipo que está cambiando la forma de comprar y vender propiedades.</p>
      </div>
      {careers.length === 0 ? (
        <EmptyState icon={Briefcase} title="No hay vacantes abiertas por ahora" text="Vuelve pronto o envíanos tu hoja de vida por el formulario de contacto." />
      ) : (
        <div className="grid gap-4">
          {careers.map((c) => (
            <Link key={c.id} href={`/empleos/${c.slug}`} className="card group flex flex-col gap-3 p-6 transition hover:border-brand sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-lg font-bold group-hover:text-brand">{c.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
                  {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>}
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {STATUS_LABELS[c.type]}</span>
                  {c.deadline && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Cierra {formatDate(c.deadline)}</span>}
                </div>
              </div>
              <span className="btn-outline shrink-0">Ver vacante <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
