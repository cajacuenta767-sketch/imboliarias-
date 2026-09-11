"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Mail } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { apiPatch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const STATUSES = [["NEW", "Nueva"], ["REVIEWED", "Revisada"], ["INTERVIEW", "Entrevista"], ["HIRED", "Contratado"], ["REJECTED", "Descartada"]];
type Row = { id: string; name: string; email: string; phone?: string | null; message?: string | null; resumeUrl?: string | null; status: string; createdAt: string; career: { title: string } };

export function ApplicationsTable({ rows, meta }: { rows: Row[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter();
  const columns: Column<Row>[] = [
    { key: "name", header: "Candidato", render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-ink-muted">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p></div> },
    { key: "career", header: "Vacante", render: (r) => r.career.title },
    { key: "message", header: "Mensaje", hideBelow: "lg", render: (r) => <p className="line-clamp-2 max-w-sm text-ink-soft">{r.message}</p> },
    { key: "status", header: "Estado", render: (r) => <select className="chip cursor-pointer border-0 bg-muted" value={r.status} onChange={async (e) => { try { await apiPatch(`/api/v1/applications/${r.id}`, { status: e.target.value }); toast.success("Actualizado"); router.refresh(); } catch (err) { toast.error((err as Error).message); } }}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> },
    { key: "createdAt", header: "Fecha", hideBelow: "md", render: (r) => formatDate(r.createdAt) },
    { key: "actions", header: "", className: "text-right", render: (r) => <RowActions>{r.resumeUrl && <IconButton title="Hoja de vida" href={r.resumeUrl}><FileText className="h-4 w-4" /></IconButton>}<IconButton title="Escribir" href={`mailto:${r.email}`}><Mail className="h-4 w-4" /></IconButton></RowActions> },
  ];
  return <DataTable columns={columns} rows={rows} meta={meta} searchPlaceholder="Buscar candidato…" emptyTitle="Sin postulaciones" />;
}
