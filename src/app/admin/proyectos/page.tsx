import { listProjects, projectQuerySchema } from "@/server/modules/projects/service";
import { PageHeader } from "@/components/ui/misc";
import { AdminProjectsTable } from "@/components/admin/projects-table";
import { parseSearchParams } from "@/server/lib/query";

export default async function AdminProjects({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = parseSearchParams(projectQuerySchema, await searchParams, { scope: "admin", perPage: "15" });
  const { items, meta } = await listProjects(q);
  return <div><PageHeader title="Proyectos" subtitle={`${meta.total} proyectos.`} /><AdminProjectsTable rows={JSON.parse(JSON.stringify(items))} meta={meta} /></div>;
}
