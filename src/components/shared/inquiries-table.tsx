"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, Trash2, Eye } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { apiDelete, apiPatch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { INQUIRY_STATUSES, STATUS_LABELS } from "@/lib/constants";

type Row = { id: string; name: string; email: string; phone?: string | null; message: string; status: string; createdAt: string; property?: { title: string; slug: string } | null; project?: { name: string; slug: string } | null };

export function InquiriesTable({ rows, meta }: { rows: Row[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [view, setView] = useState<Row | null>(null);
  const setStatus = async (r: Row, status: string) => {
    try { await apiPatch(`/api/v1/inquiries/${r.id}`, { status }); toast.success("Estado actualizado"); router.refresh(); } catch (e) { toast.error((e as Error).message); }
  };
  const open = (r: Row) => { setView(r); if (r.status === "NEW") setStatus(r, "READ"); };
  const columns: Column<Row>[] = [
    { key: "name", header: "Contacto", render: (r) => <div><button onClick={() => open(r)} className="font-semibold hover:text-brand">{r.name}</button><p className="text-xs text-ink-muted">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p></div> },
    { key: "about", header: "Sobre", hideBelow: "md", render: (r) => r.property ? <Link href={`/propiedades/${r.property.slug}`} className="text-brand hover:underline">{r.property.title}</Link> : r.project ? <Link href={`/proyectos/${r.project.slug}`} className="text-brand hover:underline">{r.project.name}</Link> : <span className="text-ink-muted">Contacto general</span> },
    { key: "message", header: "Mensaje", hideBelow: "lg", render: (r) => <p className="line-clamp-1 max-w-xs text-ink-soft">{r.message}</p> },
    { key: "status", header: "Estado", render: (r) => (
      <select className="chip cursor-pointer border-0 bg-muted" value={r.status} onChange={(e) => setStatus(r, e.target.value)}>{INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
    ) },
    { key: "createdAt", header: "Fecha", hideBelow: "md", render: (r) => <span className="text-ink-soft">{formatDate(r.createdAt)}</span> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <RowActions>
        <IconButton title="Ver" onClick={() => open(r)}><Eye className="h-4 w-4" /></IconButton>
        <IconButton title="Responder por correo" href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.property?.title ?? "tu consulta")}`}><Mail className="h-4 w-4" /></IconButton>
        {r.phone && <IconButton title="WhatsApp" href={`https://wa.me/${r.phone.replace(/\D/g, "")}`}><Phone className="h-4 w-4" /></IconButton>}
        <IconButton title="Eliminar" tone="danger" onClick={async () => { if (!confirm("¿Eliminar consulta?")) return; try { await apiDelete(`/api/v1/inquiries/${r.id}`); toast.success("Consulta eliminada"); router.refresh(); } catch (e) { toast.error((e as Error).message); } }}><Trash2 className="h-4 w-4" /></IconButton>
      </RowActions>
    ) },
  ];
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); n.delete("page"); router.push(`${pathname}?${n.toString()}`); };
  return (
    <>
      <DataTable columns={columns} rows={rows} meta={meta} searchPlaceholder="Buscar por nombre, correo o mensaje…" emptyTitle="Sin consultas"
        filters={<select className="input w-auto cursor-pointer" value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}><option value="">Todos los estados</option>{INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>} />
      <Modal open={!!view} onClose={() => setView(null)} title="Consulta" size="sm">
        {view && (
          <div className="space-y-3 p-5 text-sm">
            <div className="flex items-center justify-between"><p className="font-bold">{view.name}</p><StatusBadge value={view.status} /></div>
            <p className="text-ink-soft">{view.email}{view.phone ? ` · ${view.phone}` : ""} · {formatDate(view.createdAt)}</p>
            {view.property && <p>Sobre: <Link href={`/propiedades/${view.property.slug}`} className="text-brand hover:underline">{view.property.title}</Link></p>}
            <p className="whitespace-pre-line rounded-xl bg-muted p-4">{view.message}</p>
            <div className="flex gap-2"><a href={`mailto:${view.email}`} className="btn-primary flex-1"><Mail className="h-4 w-4" /> Responder</a>{view.phone && <a href={`https://wa.me/${view.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline flex-1"><Phone className="h-4 w-4" /> WhatsApp</a>}</div>
          </div>
        )}
      </Modal>
    </>
  );
}
