"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { DataTable, IconButton, RowActions, type Column } from "@/components/admin/data-table";
import { Price } from "@/components/site/price";
import { apiPatch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { INVOICE_STATUSES, STATUS_LABELS } from "@/lib/constants";

type Row = { id: string; number: string; status: string; total: number; currencyCode: string; createdAt: string; paidAt?: string | null; package?: { name: string } | null; user: { name: string; email: string }; payments: { gateway: string }[] };

export function InvoicesTable({ rows, meta }: { rows: Row[]; meta: { page: number; perPage: number; total: number; totalPages: number } }) {
  const router = useRouter(); const sp = useSearchParams(); const pathname = usePathname();
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); if (v) n.set(k, v); else n.delete(k); n.delete("page"); router.push(`${pathname}?${n.toString()}`); };
  const columns: Column<Row>[] = [
    { key: "number", header: "Número", render: (r) => <Link href={`/admin/facturas/${r.id}`} className="font-bold text-brand hover:underline">{r.number}</Link> },
    { key: "user", header: "Cliente", render: (r) => <div><p className="font-semibold">{r.user.name}</p><p className="text-xs text-ink-muted">{r.user.email}</p></div> },
    { key: "package", header: "Paquete", hideBelow: "md", render: (r) => r.package?.name ?? "—" },
    { key: "total", header: "Total", render: (r) => <Price amount={r.total} currencyCode={r.currencyCode} className="text-sm" /> },
    { key: "status", header: "Estado", render: (r) => (
      <select className="chip cursor-pointer border-0 bg-muted" value={r.status} onChange={async (e) => { try { await apiPatch(`/api/v1/invoices/${r.id}`, { status: e.target.value }); toast.success("Estado actualizado"); router.refresh(); } catch (err) { toast.error((err as Error).message); } }}>{INVOICE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>
    ) },
    { key: "gateway", header: "Pasarela", hideBelow: "lg", render: (r) => r.payments[0]?.gateway ?? "—" },
    { key: "createdAt", header: "Fecha", hideBelow: "lg", render: (r) => <span className="text-ink-soft">{formatDate(r.createdAt)}</span> },
    { key: "actions", header: "", className: "text-right", render: (r) => <RowActions><IconButton title="Ver" href={`/admin/facturas/${r.id}`}><Eye className="h-4 w-4" /></IconButton></RowActions> },
  ];
  return <DataTable columns={columns} rows={rows} meta={meta} searchPlaceholder="Número o cliente…" filters={<select className="input w-auto cursor-pointer" value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}><option value="">Todos</option>{INVOICE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select>} />;
}
