import { requireAdmin } from "@/server/auth/guards";
import { invoiceQuerySchema, listInvoices } from "@/server/modules/billing/service";
import { PageHeader } from "@/components/ui/misc";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { parseSearchParams } from "@/server/lib/query";

export default async function AdminInvoices({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireAdmin();
  const q = parseSearchParams(invoiceQuerySchema, await searchParams, { scope: "admin", perPage: "15" });
  const { items, meta } = await listInvoices(q, user);
  return <div><PageHeader title="Facturas" subtitle="Compras de paquetes y estado de pago." /><InvoicesTable rows={JSON.parse(JSON.stringify(items))} meta={meta} /></div>;
}
