import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import { propertyQuerySchema } from "@/server/modules/properties/schema";
import { listProperties } from "@/server/modules/properties/service";
import { PageHeader } from "@/components/ui/misc";
import { MyPropertiesTable } from "@/components/account/my-properties-table";

export default async function MyProperties({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = propertyQuerySchema.parse({ ...sp, scope: "mine", perPage: "10" });
  const { items, meta } = await listProperties(q, user);
  return (
    <div>
      <PageHeader title="Mis propiedades" subtitle="Gestiona, renueva y edita tus publicaciones.">
        <Link href="/cuenta/propiedades/nueva" className="btn-primary"><Plus className="h-4 w-4" /> Nueva propiedad</Link>
      </PageHeader>
      <MyPropertiesTable rows={JSON.parse(JSON.stringify(items))} meta={meta} />
    </div>
  );
}
