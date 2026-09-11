import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { ContentForm } from "@/components/admin/content-form";
import { CAREER_FIELDS } from "@/components/admin/page-fields";

export default async function EditCareer({ params }: { params: Promise<{ id: string }> }) {
  const c = await db.career.findUnique({ where: { id: (await params).id } });
  if (!c) notFound();
  return <div><PageHeader title={c.title} /><ContentForm id={c.id} endpoint="/api/v1/careers" backHref="/admin/empleos" fields={CAREER_FIELDS} initial={{ title: c.title, description: c.description ?? "", content: c.content ?? "", location: c.location ?? "", salary: c.salary ?? "", type: c.type, status: c.status, deadline: c.deadline?.toISOString().slice(0, 10) ?? "" }} /></div>;
}
