"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink, Plus } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/site/price";
import { apiDelete } from "@/lib/api";
import type { ProjectCard } from "@/server/modules/projects/service";

export function AdminProjectsTable({ rows, meta }: { rows: ProjectCard[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter();
  const columns: Column<ProjectCard>[] = [
    { key: "name", header: "Proyecto", render: (r) => (
      <div className="flex items-center gap-3"><div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><SmartImage src={r.images[0]?.url} alt="" className="h-full w-full" /></div><div><Link href={`/admin/proyectos/${r.id}`} className="font-semibold hover:text-brand">{r.name}</Link><p className="text-xs text-ink-muted">{r.city?.name} · {r.investor?.name ?? "—"}</p></div></div>
    ) },
    { key: "status", header: "Estado", render: (r) => <StatusBadge value={r.status} /> },
    { key: "price", header: "Desde", hideBelow: "md", render: (r) => r.priceFrom != null ? <Price amount={r.priceFrom} currencyCode={r.currencyCode} className="text-sm" /> : "—" },
    { key: "units", header: "Unidades", hideBelow: "lg", render: (r) => <span>{r.units ?? "—"} <span className="text-ink-muted">({r._count.properties} publicadas)</span></span> },
    { key: "featured", header: "Destacado", hideBelow: "lg", render: (r) => (r.isFeatured ? <span className="chip bg-accent-soft text-accent-strong">Sí</span> : <span className="text-ink-muted">No</span>) },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <RowActions>
        <IconButton title="Ver" href={`/proyectos/${r.slug}`}><ExternalLink className="h-4 w-4" /></IconButton>
        <IconButton title="Editar" href={`/admin/proyectos/${r.id}`}><Pencil className="h-4 w-4" /></IconButton>
        <IconButton title="Eliminar" tone="danger" onClick={async () => { if (!confirm("¿Eliminar proyecto?")) return; try { await apiDelete(`/api/v1/projects/${r.id}`); toast.success("Eliminado"); router.refresh(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4" /></IconButton>
      </RowActions>
    ) },
  ];
  return <DataTable columns={columns} rows={rows} meta={meta} searchPlaceholder="Buscar proyecto…" toolbar={<Link href="/admin/proyectos/nueva" className="btn-primary py-2"><Plus className="h-4 w-4" /> Crear</Link>} />;
}
