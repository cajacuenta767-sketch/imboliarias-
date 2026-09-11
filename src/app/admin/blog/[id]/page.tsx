import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { listPostCategories } from "@/server/modules/posts/service";
import { PageHeader } from "@/components/ui/misc";
import { ContentForm } from "@/components/admin/content-form";
import { POST_FIELDS } from "@/components/admin/page-fields";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const [p, cats] = await Promise.all([db.post.findUnique({ where: { id: (await params).id } }), listPostCategories()]);
  if (!p) notFound();
  return <div><PageHeader title={p.title} /><ContentForm id={p.id} endpoint="/api/v1/posts" backHref="/admin/blog" fields={POST_FIELDS(cats.map((c) => ({ value: c.id, label: c.name })))} initial={{ title: p.title, excerpt: p.excerpt ?? "", content: p.content ?? "", coverUrl: p.coverUrl ?? "", tags: p.tags ?? "", status: p.status, categoryId: p.categoryId ?? "", publishedAt: p.publishedAt?.toISOString().slice(0, 10) ?? "", isFeatured: p.isFeatured }} /></div>;
}
