"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { apiDelete, apiPatch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { REVIEW_STATUSES, STATUS_LABELS } from "@/lib/constants";

type Row = { id: string; authorName: string; rating: number; comment: string; status: string; createdAt: string; property: { title: string; slug: string } };

export function ReviewsTable({ rows, meta }: { rows: Row[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter(); const sp = useSearchParams(); const pathname = usePathname();
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast.success(msg); router.refresh(); } catch (e) { toast.error((e as Error).message); } };
  const columns: Column<Row>[] = [
    { key: "authorName", header: "Autor", render: (r) => <div><p className="font-semibold">{r.authorName}</p><Stars value={r.rating} /></div> },
    { key: "comment", header: "Comentario", render: (r) => <p className="max-w-md text-ink-soft">{r.comment}</p> },
    { key: "property", header: "Propiedad", hideBelow: "md", render: (r) => <Link href={`/propiedades/${r.property.slug}`} className="text-brand hover:underline">{r.property.title}</Link> },
    { key: "status", header: "Estado", render: (r) => <StatusBadge value={r.status} /> },
    { key: "createdAt", header: "Fecha", hideBelow: "lg", render: (r) => <span className="text-ink-soft">{formatDate(r.createdAt)}</span> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <RowActions>
        {r.status !== "APPROVED" && <IconButton title="Aprobar" tone="brand" onClick={() => act(() => apiPatch(`/api/v1/reviews/${r.id}`, { status: "APPROVED" }), "Aprobada")}><CheckCircle2 className="h-4 w-4" /></IconButton>}
        {r.status !== "REJECTED" && <IconButton title="Rechazar" onClick={() => act(() => apiPatch(`/api/v1/reviews/${r.id}`, { status: "REJECTED" }), "Rechazada")}><XCircle className="h-4 w-4" /></IconButton>}
        <IconButton title="Eliminar" tone="danger" onClick={() => confirm("¿Eliminar reseña?") && act(() => apiDelete(`/api/v1/reviews/${r.id}`), "Eliminada")}><Trash2 className="h-4 w-4" /></IconButton>
      </RowActions>
    ) },
  ];
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); n.delete("page"); router.push(`${pathname}?${n.toString()}`); };
  return <DataTable columns={columns} rows={rows} meta={meta} searchPlaceholder="Buscar…" filters={<select className="input w-auto cursor-pointer" value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}><option value="">Todos</option>{REVIEW_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>} />;
}
