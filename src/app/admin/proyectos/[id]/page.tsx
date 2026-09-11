import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/admin/project-form";
import { getProjectById } from "@/server/modules/projects/service";
import { getProjectFormOptions, toProjectFormValues } from "@/server/modules/projects/form-options";
import { HttpError } from "@/server/errors";

export default async function AdminEditProject({ params }: { params: Promise<{ id: string }> }) {
  let p;
  try { p = await getProjectById((await params).id); } catch (e) { if (e instanceof HttpError) notFound(); throw e; }
  const options = await getProjectFormOptions();
  return <div><PageHeader title={p.name}><StatusBadge value={p.status} /></PageHeader><ProjectForm id={p.id} initial={toProjectFormValues(p)} options={options} /></div>;
}
