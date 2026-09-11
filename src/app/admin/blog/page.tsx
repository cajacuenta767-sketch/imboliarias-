import { listPostCategories, listPosts, postQuerySchema } from "@/server/modules/posts/service";
import { PageHeader } from "@/components/ui/misc";
import { PostsTable } from "@/components/admin/content-table";

export default async function AdminBlog({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = postQuerySchema.parse({ ...(await searchParams), scope: "admin", perPage: "15" });
  const [{ items, meta }, cats] = await Promise.all([listPosts(q), listPostCategories()]);
  return <div><PageHeader title="Blog" subtitle="Noticias, guías y novedades del mercado." /><PostsTable rows={JSON.parse(JSON.stringify(items))} meta={meta} categories={JSON.parse(JSON.stringify(cats))} /></div>;
}
