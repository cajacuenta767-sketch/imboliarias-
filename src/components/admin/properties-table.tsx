"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ExternalLink, Eye, CheckCircle2, XCircle, Upload, Download, Plus, Copy } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/site/price";
import { apiDelete, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MODERATION_STATUSES, PROPERTY_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { PropertyCard } from "@/server/modules/properties/service";

type Row = PropertyCard & { moderation: string; status: string; views: number; expiresAt: string | null; uniqueId: string | null; createdAt: string; author?: { name: string } };

export function AdminPropertiesTable({ rows, meta }: { rows: Row[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast.success(msg); router.refresh(); } catch (e) { toast.error((e as Error).message); } };
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); n.delete("page"); router.push(`${pathname}?${n.toString()}`); };
  const importCsv = async (f: File | undefined) => {
    if (!f) return;
    const fd = new FormData(); fd.set("file", f);
    try {
      const res = await fetch("/api/v1/properties/import", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(`${j.data.created} propiedades importadas${j.data.errors.length ? `, ${j.data.errors.length} con errores` : ""}`);
      if (j.data.errors.length) console.warn(j.data.errors);
      router.refresh();
    } catch (e) { toast.error((e as Error).message); }
  };
  const columns: Column<Row>[] = [
    { key: "title", header: "Propiedad", render: (r) => (
      <div className="flex items-center gap-3">
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><SmartImage src={r.images[0]?.url} alt="" className="h-full w-full" /></div>
        <div className="min-w-0"><Link href={`/admin/propiedades/${r.id}`} className="block max-w-[260px] truncate font-semibold hover:text-brand">{r.title}</Link><p className="text-xs text-ink-muted">{r.uniqueId} · {r.city?.name ?? "—"} · {r.author?.name ?? r.agent?.user.name}</p></div>
      </div>
    ) },
    { key: "price", header: "Precio", render: (r) => <Price amount={r.price} currencyCode={r.currencyCode} period={r.period} type={r.type} className="text-sm" /> },
    { key: "type", header: "Tipo", hideBelow: "md", render: (r) => <StatusBadge value={r.type} /> },
    { key: "moderation", header: "Moderación", render: (r) => <StatusBadge value={r.moderation} /> },
    { key: "status", header: "Estado", hideBelow: "lg", render: (r) => <StatusBadge value={r.status} /> },
    { key: "views", header: "Vistas", hideBelow: "lg", render: (r) => <span className="inline-flex items-center gap-1 text-ink-soft"><Eye className="h-3.5 w-3.5" /> {r.views}</span> },
    { key: "createdAt", header: "Creada", hideBelow: "lg", render: (r) => <span className="whitespace-nowrap text-ink-soft">{formatDate(r.createdAt)}</span> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <RowActions>
        {r.moderation === "PENDING" && <IconButton title="Aprobar" tone="brand" onClick={() => act(() => apiPost(`/api/v1/properties/${r.id}/moderate`, { moderation: "APPROVED" }), "Aprobada")}><CheckCircle2 className="h-4 w-4" /></IconButton>}
        {r.moderation === "PENDING" && <IconButton title="Rechazar" tone="danger" onClick={() => act(() => apiPost(`/api/v1/properties/${r.id}/moderate`, { moderation: "REJECTED" }), "Rechazada")}><XCircle className="h-4 w-4" /></IconButton>}
        <IconButton title="Ver en el sitio" href={`/propiedades/${r.slug}`}><ExternalLink className="h-4 w-4" /></IconButton>
        <IconButton title="Duplicar" onClick={() => act(() => apiPost(`/api/v1/properties/${r.id}/duplicate`), "Duplicada")}><Copy className="h-4 w-4" /></IconButton>
        <IconButton title="Editar" href={`/admin/propiedades/${r.id}`}><Pencil className="h-4 w-4" /></IconButton>
        <IconButton title="Eliminar" tone="danger" onClick={() => confirm("¿Eliminar esta propiedad?") && act(() => apiDelete(`/api/v1/properties/${r.id}`), "Eliminada")}><Trash2 className="h-4 w-4" /></IconButton>
      </RowActions>
    ) },
  ];
  const sel = (k: string, opts: readonly string[], all: string) => (
    <select className="input w-auto cursor-pointer" value={sp.get(k) ?? ""} onChange={(e) => setParam(k, e.target.value)}><option value="">{all}</option>{opts.map((o) => <option key={o} value={o}>{STATUS_LABELS[o]}</option>)}</select>
  );
  return (
    <DataTable
      columns={columns} rows={rows} meta={meta} searchPlaceholder="Buscar por título, código o dirección…"
      bulkActions={[{ label: "Aprobar", value: "approve" }, { label: "Rechazar", value: "reject" }, { label: "Destacar", value: "feature" }, { label: "Quitar destacado", value: "unfeature" }, { label: "Ocultar", value: "hide" }, { label: "Mostrar", value: "show" }, { label: "Eliminar", value: "delete", danger: true }]}
      onBulk={(ids, action) => act(() => apiPost("/api/v1/properties/bulk", { ids, action }), "Acción aplicada")}
      filters={<>{sel("type", ["SALE", "RENT"], "Venta y alquiler")}{sel("moderation", MODERATION_STATUSES, "Toda moderación")}{sel("status", PROPERTY_STATUSES, "Todos los estados")}</>}
      toolbar={<>
        <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} className="btn-outline py-2"><Upload className="h-4 w-4" /> Importar</button>
        <a href={`/api/v1/properties/export?${sp.toString()}`} className="btn-outline py-2"><Download className="h-4 w-4" /> Exportar</a>
        <Link href="/admin/propiedades/nueva" className="btn-primary py-2"><Plus className="h-4 w-4" /> Crear</Link>
      </>}
      emptyTitle="No hay propiedades con esos filtros"
    />
  );
}
