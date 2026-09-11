import { requireUser } from "@/server/auth/guards";
import { inquiryQuerySchema, listInquiries } from "@/server/modules/inquiries/service";
import { PageHeader } from "@/components/ui/misc";
import { InquiriesTable } from "@/components/shared/inquiries-table";

export default async function MyInquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const q = inquiryQuerySchema.parse({ ...(await searchParams), scope: "mine" });
  const { items, meta } = await listInquiries(q, user);
  return (
    <div>
      <PageHeader title="Consultas recibidas" subtitle="Mensajes de personas interesadas en tus propiedades." />
      <InquiriesTable rows={JSON.parse(JSON.stringify(items))} meta={meta} />
    </div>
  );
}
