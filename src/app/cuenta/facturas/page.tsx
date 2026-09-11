import Link from "next/link";
import { requireUser } from "@/server/auth/guards";
import { invoiceQuerySchema, listInvoices } from "@/server/modules/billing/service";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { Price } from "@/components/site/price";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const q = invoiceQuerySchema.parse({ ...(await searchParams), scope: "mine" });
  const { items, meta } = await listInvoices(q, user);
  return (
    <div>
      <PageHeader title="Facturas" subtitle="Historial de compras de paquetes." />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-ink-soft"><tr><th className="px-4 py-3">Número</th><th className="px-4 py-3">Paquete</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-line">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-muted/40"><td className="px-4 py-3"><Link href={`/cuenta/facturas/${i.id}`} className="font-semibold text-brand hover:underline">{i.number}</Link></td><td className="px-4 py-3">{i.package?.name}</td><td className="px-4 py-3 text-ink-soft">{formatDate(i.createdAt)}</td><td className="px-4 py-3"><StatusBadge value={i.status} /></td><td className="px-4 py-3 text-right"><Price amount={i.total} currencyCode={i.currencyCode} className="text-sm" /></td></tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Sin facturas.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination page={meta.page} totalPages={meta.totalPages} className="mt-6" />
    </div>
  );
}
