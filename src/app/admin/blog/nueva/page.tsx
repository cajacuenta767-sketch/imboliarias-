import { listPostCategories } from "@/server/modules/posts/service";
import { PageHeader } from "@/components/ui/misc";
import { ContentForm } from "@/components/admin/content-form";
import { POST_FIELDS } from "@/components/admin/page-fields";

export default async function NewPost() {
  const cats = await listPostCategories();
  return <div><PageHeader title="Nuevo artículo" /><ContentForm endpoint="/api/v1/posts" backHref="/admin/blog" fields={POST_FIELDS(cats.map((c) => ({ value: c.id, label: c.name })))} initial={{ title: "", excerpt: "", content: "", coverUrl: "", tags: "", status: "PUBLISHED", categoryId: "", publishedAt: new Date().toISOString().slice(0, 10), isFeatured: false }} /></div>;
}
