import { listPages } from "@/server/modules/pages/service";
import { PageHeader } from "@/components/ui/misc";
import { PagesTable } from "@/components/admin/content-table";

export default async function AdminPages() {
  const rows = JSON.parse(JSON.stringify(await listPages()));
  return <div><PageHeader title="Páginas" subtitle="Contenido estático: nosotros, servicios, términos…" /><PagesTable rows={rows} /></div>;
}
