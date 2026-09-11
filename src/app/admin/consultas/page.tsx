import { requireAdmin } from "@/server/auth/guards";
import { inquiryQuerySchema, listInquiries } from "@/server/modules/inquiries/service";
import { PageHeader } from "@/components/ui/misc";
import { InquiriesTable } from "@/components/shared/inquiries-table";
import { parseSearchParams } from "@/server/lib/query";

export default async function AdminInquiries({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireAdmin();
  const q = parseSearchParams(inquiryQuerySchema, await searchParams, { scope: "admin", perPage: "15" });
  const { items, meta } = await listInquiries(q, user);
  return <div><PageHeader title="Consultas" subtitle="Todos los mensajes recibidos desde el sitio." /><InquiriesTable rows={JSON.parse(JSON.stringify(items))} meta={meta} /></div>;
}
