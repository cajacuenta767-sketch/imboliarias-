"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink, Plus } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { PostCategoriesManager } from "@/components/admin/post-categories";
import { apiDelete } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type Meta = { page: number; perPage: number; total: number; totalPages: number };

function ContentTable<T extends { id: string }>({ rows, meta, columns, endpoint, basePath, viewHref, createLabel = "Crear", extraToolbar }: { rows: T[]; meta?: Meta; columns: Column<T>[]; endpoint: string; basePath: string; viewHref?: (r: T) => string; createLabel?: string; extraToolbar?: React.ReactNode }) {
  const router = useRouter();
  const cols: Column<T>[] = [
    ...columns,
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <RowActions>
        {viewHref && <IconButton title="Ver" href={viewHref(r)}><ExternalLink className="h-4 w-4" /></IconButton>}
        <IconButton title="Editar" href={`${basePath}/${r.id}`}><Pencil className="h-4 w-4" /></IconButton>
        <IconButton title="Eliminar" tone="danger" onClick={async () => { if (!confirm("¿Eliminar?")) return; try { await apiDelete(`${endpoint}/${r.id}`); toast.success("Eliminado"); router.refresh(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4" /></IconButton>
      </RowActions>
    ) },
  ];
  return <DataTable columns={cols} rows={rows} meta={meta} toolbar={<>{extraToolbar}<Link href={`${basePath}/nueva`} className="btn-primary py-2"><Plus className="h-4 w-4" /> {createLabel}</Link></>} />;
}

export type PageRow = { id: string; title: string; slug: string; template: string; status: string; updatedAt: string };
export function PagesTable({ rows }: { rows: PageRow[] }) {
  return (
    <ContentTable rows={rows} endpoint="/api/v1/pages" basePath="/admin/paginas" viewHref={(r) => `/${r.slug}`} createLabel="Nueva página"
      columns={[{ key: "title", header: "Título", render: (r) => <span className="font-semibold">{r.title}</span> }, { key: "slug", header: "URL", render: (r) => <code className="text-xs text-ink-muted">/{r.slug}</code> }, { key: "template", header: "Plantilla", hideBelow: "md" }, { key: "status", header: "Estado", render: (r) => <StatusBadge value={r.status} /> }, { key: "updatedAt", header: "Actualizada", hideBelow: "lg", render: (r) => <span className="whitespace-nowrap">{formatDate(r.updatedAt)}</span> }]} />
  );
}

export type PostRow = { id: string; title: string; slug: string; coverUrl?: string | null; status: string; views: number; publishedAt: string | null; category?: { name: string } | null; author?: { name: string } | null };
export function PostsTable({ rows, meta, categories }: { rows: PostRow[]; meta: Meta; categories: { id: string; name: string; slug: string; _count: { posts: number } }[] }) {
  return (
    <ContentTable rows={rows} meta={meta} endpoint="/api/v1/posts" basePath="/admin/blog" viewHref={(r) => `/noticias/${r.slug}`} createLabel="Nuevo artículo" extraToolbar={<PostCategoriesManager categories={categories} />}
      columns={[{ key: "title", header: "Artículo", render: (r) => <div className="flex items-center gap-3"><div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><SmartImage src={r.coverUrl} alt="" className="h-full w-full" /></div><div><p className="font-semibold">{r.title}</p><p className="text-xs text-ink-muted">{r.category?.name ?? "Sin categoría"} · {r.author?.name}</p></div></div> }, { key: "status", header: "Estado", render: (r) => <StatusBadge value={r.status} /> }, { key: "views", header: "Vistas", hideBelow: "md" }, { key: "publishedAt", header: "Publicado", hideBelow: "lg", render: (r) => <span className="whitespace-nowrap">{formatDate(r.publishedAt)}</span> }]} />
  );
}

export type CareerRow = { id: string; title: string; slug: string; location?: string | null; type: string; status: string; deadline?: string | null; _count: { applications: number } };
export function CareersTable({ rows }: { rows: CareerRow[] }) {
  return (
    <ContentTable rows={rows} endpoint="/api/v1/careers" basePath="/admin/empleos" viewHref={(r) => `/empleos/${r.slug}`} createLabel="Nueva vacante"
      columns={[{ key: "title", header: "Vacante", render: (r) => <span className="font-semibold">{r.title}</span> }, { key: "location", header: "Ubicación", hideBelow: "md" }, { key: "type", header: "Tipo", render: (r) => <StatusBadge value={r.type} /> }, { key: "status", header: "Estado", render: (r) => <StatusBadge value={r.status} /> }, { key: "apps", header: "Postulaciones", render: (r) => r._count.applications }, { key: "deadline", header: "Cierra", hideBelow: "lg", render: (r) => <span className="whitespace-nowrap">{formatDate(r.deadline) || "—"}</span> }]} />
  );
}
