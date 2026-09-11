import Link from "next/link";
import { Building2, Eye, MessageSquare, Coins, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import { accountStats } from "@/server/modules/dashboard/service";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate } from "@/lib/utils";

export default async function AccountHome() {
  const user = await requireUser();
  const [s, recent, inquiries] = await Promise.all([
    accountStats(user.id),
    db.property.findMany({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { images: { take: 1, orderBy: { order: "asc" } }, city: true } }),
    db.inquiry.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { property: { select: { title: true } } } }),
  ]);
  const kpis = [
    { label: "Propiedades", value: s.total, icon: Building2, tone: "bg-brand-soft text-brand" },
    { label: "Aprobadas", value: s.approved, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "En moderación", value: s.pending, icon: Clock, tone: "bg-amber-50 text-amber-700" },
    { label: "Vistas totales", value: s.views.toLocaleString("es-CO"), icon: Eye, tone: "bg-sky-50 text-sky-700" },
    { label: "Consultas nuevas", value: s.inquiries, icon: MessageSquare, tone: "bg-rent-soft text-rent" },
    { label: "Créditos", value: s.credits, icon: Coins, tone: "bg-accent-soft text-accent-strong" },
  ];
  return (
    <div>
      <PageHeader title={`Hola, ${user.name?.split(" ")[0]}`} subtitle="Este es el resumen de tu actividad en Habitta." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></span>
            <p className="font-display text-2xl font-extrabold">{k.value}</p>
            <p className="text-xs text-ink-muted">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h3 className="font-display font-bold">Últimas propiedades</h3><Link href="/cuenta/propiedades" className="text-xs font-semibold text-brand">Ver todas <ArrowRight className="inline h-3 w-3" /></Link></div>
          <ul className="divide-y divide-line">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><SmartImage src={p.images[0]?.url} alt="" className="h-full w-full" /></div>
                <div className="min-w-0 flex-1"><Link href={`/cuenta/propiedades/${p.id}/editar`} className="block truncate text-sm font-semibold hover:text-brand">{p.title}</Link><p className="text-xs text-ink-muted">{p.city?.name} · {p.views} vistas</p></div>
                <StatusBadge value={p.moderation} />
              </li>
            ))}
            {recent.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-muted">Aún no has publicado. <Link href="/cuenta/propiedades/nueva" className="font-semibold text-brand">Publica tu primera propiedad</Link></li>}
          </ul>
        </div>
        <div className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h3 className="font-display font-bold">Consultas recientes</h3><Link href="/cuenta/consultas" className="text-xs font-semibold text-brand">Ver todas <ArrowRight className="inline h-3 w-3" /></Link></div>
          <ul className="divide-y divide-line">
            {inquiries.map((i) => (
              <li key={i.id} className="px-5 py-3">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{i.name}</p><StatusBadge value={i.status} /></div>
                <p className="truncate text-xs text-ink-muted">{i.property?.title ?? "Contacto general"} · {formatDate(i.createdAt)}</p>
                <p className="mt-1 line-clamp-1 text-sm text-ink-soft">{i.message}</p>
              </li>
            ))}
            {inquiries.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-muted">Sin consultas todavía.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
