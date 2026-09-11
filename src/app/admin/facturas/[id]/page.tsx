import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/guards";
import { getInvoice } from "@/server/modules/billing/service";
import { getSettings } from "@/server/modules/settings/service";
import { HttpError } from "@/server/errors";
import { InvoiceView } from "@/components/shared/invoice-view";

export default async function AdminInvoice({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  let inv;
  try { inv = await getInvoice((await params).id, user); } catch (e) { if (e instanceof HttpError) notFound(); throw e; }
  return <InvoiceView invoice={JSON.parse(JSON.stringify(inv))} settings={await getSettings()} backHref="/admin/facturas" />;
}
