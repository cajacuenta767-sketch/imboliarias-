import { PageHeader } from "@/components/ui/misc";
import { ProjectForm } from "@/components/admin/project-form";
import { emptyProjectValues, getProjectFormOptions } from "@/server/modules/projects/form-options";

export default async function AdminNewProject() {
  const options = await getProjectFormOptions();
  return <div><PageHeader title="Nuevo proyecto" /><ProjectForm initial={emptyProjectValues} options={options} /></div>;
}
