import { applicationQuerySchema, listApplications, listCareers } from "@/server/modules/careers/service";
import { PageHeader } from "@/components/ui/misc";
import { CareersTable } from "@/components/admin/content-table";
import { ApplicationsTable } from "@/components/admin/applications-table";

export default async function AdminCareers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [careers, apps] = await Promise.all([listCareers(), listApplications(applicationQuerySchema.parse({ ...(await searchParams), perPage: "10" }))]);
  return (
    <div>
      <PageHeader title="Carreras" subtitle="Vacantes publicadas y postulaciones recibidas." />
      <CareersTable rows={JSON.parse(JSON.stringify(careers))} />
      <h2 className="mb-3 mt-10 font-display text-xl font-bold">Postulaciones</h2>
      <ApplicationsTable rows={JSON.parse(JSON.stringify(apps.items))} meta={apps.meta} />
    </div>
  );
}
