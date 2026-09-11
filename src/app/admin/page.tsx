import Link from "next/link";
import { Building2, Clock, Users, MessageSquare, Receipt, Eye, FolderKanban, Star, ArrowRight, TrendingUp } from "lucide-react";
import { adminStats } from "@/server/modules/dashboard/service";
import { ActivityChart, CityChart, RevenueChart } from "@/components/admin/dashboard-charts";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function AdminDashboard() {
  const s = await adminStats();
  const k = s.kpis;
  const kpis = [
    { label: "Propiedades", value: k.properties, sub: `${k.forSale} venta · ${k.forRent} alquiler`, icon: Building2, tone: "bg-brand-soft text-brand", href: "/admin/propiedades" },
    { label: "Pendientes de moderar", value: k.pendingModeration, sub: "Revisar y aprobar", icon: Clock, tone: "bg-amber-50 text-amber-700", href: "/admin/propiedades?moderation=PENDING" },
    { label: "Consultas nuevas", value: k.inquiriesNew, sub: "Sin responder", icon: MessageSquare, tone: "bg-rent-soft text-rent", href: "/admin/consultas?status=NEW" },
    { label: "Ingresos totales", value: `US$${formatNumber(k.revenue, 0)}`, sub: `${k.invoicesPaid} facturas este mes`, icon: Receipt, tone: "bg-emerald-50 text-emerald-700", href: "/admin/facturas" },
    { label: "Usuarios", value: k.users, sub: `${k.agents} agentes`, icon: Users, tone: "bg-sky-50 text-sky-700", href: "/admin/cuentas" },
    { label: "Proyectos", value: k.projects, sub: "Obra nueva", icon: FolderKanban, tone: "bg-muted text-ink-soft", href: "/admin/proyectos" },
    { label: "Vistas acumuladas", value: formatNumber(k.views), sub: "En todas las fichas", icon: Eye, tone: "bg-muted text-ink-soft", href: "/admin/propiedades?sort=views" },
    { label: "Reseñas pendientes", value: k.reviewsPending, sub: "Por aprobar", icon: Star, tone: "bg-accent-soft text-accent-strong", href: "/admin/resenas?status=PENDING" },
  ];
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Qué está pasando hoy en tu inmobiliaria.">
        <Link href="/admin/propiedades/nueva" className="btn-primary">Nueva propiedad</Link>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((x) => (
          <Link key={x.label} href={x.href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
            <div className="flex items-start justify-between">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${x.tone}`}><x.icon className="h-5 w-5" /></span>
              <ArrowRight className="h-4 w-4 text-ink-muted opacity-0 transition group-hover:opacity-100" />
            </div>
            <p className="mt-4 font-display text-2xl font-extrabold tracking-tight">{x.value}</p>
            <p className="text-sm font-semibold text-ink">{x.label}</p>
            <p className="text-xs text-ink-muted">{x.sub}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display font-bold">Actividad de los últimos 6 meses</h3><span className="chip bg-muted text-ink-soft"><TrendingUp className="h-3 w-3" /> propiedades vs consultas</span></div>
          <ActivityChart data={s.series} />
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-display font-bold">Propiedades por ciudad</h3>
          <CityChart data={s.byCity} />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h3 className="font-display font-bold">Últimas propiedades</h3><Link href="/admin/propiedades" className="text-xs font-semibold text-brand">Ver todas</Link></div>
          <ul className="divide-y divide-line">
            {s.recentProperties.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><SmartImage src={p.images[0]?.url} alt="" className="h-full w-full" /></div>
                <div className="min-w-0 flex-1"><Link href={`/admin/propiedades/${p.id}`} className="block truncate text-sm font-semibold hover:text-brand">{p.title}</Link><p className="text-xs text-ink-muted">{p.author.name} · {p.city?.name} · {formatDate(p.createdAt)}</p></div>
                <StatusBadge value={p.moderation} />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="card p-5"><h3 className="mb-2 font-display font-bold">Ingresos por mes</h3><RevenueChart data={s.series} /></div>
          <div className="card">
            <div className="border-b border-line px-5 py-4"><h3 className="font-display font-bold">Consultas recientes</h3></div>
            <ul className="divide-y divide-line">
              {s.recentInquiries.map((i) => (
                <li key={i.id} className="px-5 py-3"><div className="flex justify-between"><p className="text-sm font-semibold">{i.name}</p><StatusBadge value={i.status} /></div><p className="truncate text-xs text-ink-muted">{i.property?.title ?? "Contacto general"}</p></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
