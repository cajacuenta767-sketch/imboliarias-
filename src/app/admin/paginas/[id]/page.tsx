import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { ContentForm } from "@/components/admin/content-form";
import { PAGE_FIELDS } from "@/components/admin/page-fields";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await db.page.findUnique({ where: { id: (await params).id } });
  if (!p) notFound();
  return <div><PageHeader title={p.title} subtitle={`/${p.slug}`} /><ContentForm id={p.id} endpoint="/api/v1/pages" backHref="/admin/paginas" fields={PAGE_FIELDS} initial={{ title: p.title, slug: p.slug, template: p.template, content: p.content ?? "", metaTitle: p.metaTitle ?? "", metaDescription: p.metaDescription ?? "", status: p.status }} /></div>;
}
