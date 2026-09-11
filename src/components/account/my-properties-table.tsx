"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, RefreshCw, Copy, ExternalLink, Eye } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/site/price";
import { apiDelete, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MODERATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { PropertyCard } from "@/server/modules/properties/service";

type Row = PropertyCard & { moderation: string; status: string; views: number; expiresAt: string | null; uniqueId: string | null };

export function MyPropertiesTable({ rows, meta }: { rows: Row[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); router.refresh(); } catch (e) { toast.error((e as Error).message); }
  };
  const columns: Column<Row>[] = [
    { key: "title", header: "Propiedad", render: (r) => (
      <div className="flex items-center gap-3">
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><SmartImage src={r.images[0]?.url} alt="" className="h-full w-full" /></div>
        <div className="min-w-0"><Link href={`/cuenta/propiedades/${r.id}/editar`} className="block truncate font-semibold hover:text-brand">{r.title}</Link><p className="text-xs text-ink-muted">{r.uniqueId} · {r.city?.name ?? "—"}</p></div>
      </div>
    ) },
    { key: "price", header: "Precio", render: (r) => <Price amount={r.price} currencyCode={r.currencyCode} period={r.period} type={r.type} className="text-sm" /> },
    { key: "type", header: "Tipo", hideBelow: "md", render: (r) => <StatusBadge value={r.type} /> },
    { key: "moderation", header: "Moderación", render: (r) => <StatusBadge value={r.moderation} /> },
    { key: "status", header: "Estado", hideBelow: "lg", render: (r) => <StatusBadge value={r.status} /> },
    { key: "views", header: "Vistas", hideBelow: "md", render: (r) => <span className="inline-flex items-center gap-1 text-ink-soft"><Eye className="h-3.5 w-3.5" /> {r.views}</span> },
    { key: "expiresAt", header: "Expira", hideBelow: "lg", render: (r) => <span className={r.expiresAt && new Date(r.expiresAt) < new Date() ? "whitespace-nowrap text-danger" : "whitespace-nowrap text-ink-soft"}>{formatDate(r.expiresAt)}</span> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <RowActions>
        {r.moderation === "APPROVED" && <IconButton title="Ver en el sitio" href={`/propiedades/${r.slug}`}><ExternalLink className="h-4 w-4" /></IconButton>}
        <IconButton title="Renovar (1 crédito)" tone="brand" onClick={() => act(() => apiPost(`/api/v1/properties/${r.id}/renew`), "Publicación renovada")}><RefreshCw className="h-4 w-4" /></IconButton>
        <IconButton title="Duplicar" onClick={() => act(() => apiPost(`/api/v1/properties/${r.id}/duplicate`), "Propiedad duplicada")}><Copy className="h-4 w-4" /></IconButton>
        <IconButton title="Editar" href={`/cuenta/propiedades/${r.id}/editar`}><Pencil className="h-4 w-4" /></IconButton>
        <IconButton title="Eliminar" tone="danger" onClick={() => confirm("¿Eliminar esta propiedad?") && act(() => apiDelete(`/api/v1/properties/${r.id}`), "Propiedad eliminada")}><Trash2 className="h-4 w-4" /></IconButton>
      </RowActions>
    ) },
  ];
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); n.delete("page"); router.push(`${pathname}?${n.toString()}`); };
  return (
    <DataTable
      columns={columns}
      rows={rows}
      meta={meta}
      searchPlaceholder="Buscar por título o código…"
      filters={
        <select className="input w-auto cursor-pointer" value={sp.get("moderation") ?? ""} onChange={(e) => setParam("moderation", e.target.value)}>
          <option value="">Toda moderación</option>
          {MODERATION_STATUSES.map((m) => <option key={m} value={m}>{STATUS_LABELS[m]}</option>)}
        </select>
      }
      emptyTitle="Aún no tienes propiedades"
    />
  );
}
