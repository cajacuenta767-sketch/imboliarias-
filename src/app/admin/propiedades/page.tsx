import { requireAdmin } from "@/server/auth/guards";
import { propertyQuerySchema } from "@/server/modules/properties/schema";
import { listProperties } from "@/server/modules/properties/service";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { AdminPropertiesTable } from "@/components/admin/properties-table";

export default async function AdminProperties({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireAdmin();
  const q = propertyQuerySchema.parse({ ...(await searchParams), scope: "admin", perPage: "15" });
  const { items, meta } = await listProperties(q, user);
  const authors = await db.user.findMany({ where: { id: { in: items.map((i) => i.authorId) } }, select: { id: true, name: true } });
  const rows = items.map((i) => ({ ...i, author: authors.find((a) => a.id === i.authorId) }));
  return (
    <div>
      <PageHeader title="Propiedades" subtitle={`${meta.total} propiedades en total.`} />
      <AdminPropertiesTable rows={JSON.parse(JSON.stringify(rows))} meta={meta} />
    </div>
  );
}
