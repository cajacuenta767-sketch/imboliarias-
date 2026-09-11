import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guards";
import { getInvoice } from "@/server/modules/billing/service";
import { getSettings } from "@/server/modules/settings/service";
import { HttpError } from "@/server/errors";
import { InvoiceView } from "@/components/shared/invoice-view";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  let inv;
  try { inv = await getInvoice((await params).id, user); } catch (e) { if (e instanceof HttpError) notFound(); throw e; }
  const settings = await getSettings();
  return <InvoiceView invoice={JSON.parse(JSON.stringify(inv))} settings={settings} />;
}
