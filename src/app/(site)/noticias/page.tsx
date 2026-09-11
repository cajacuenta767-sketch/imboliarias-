import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/site/cards";
import { Pagination } from "@/components/ui/pagination";
import { listPostCategories, listPosts, postQuerySchema } from "@/server/modules/posts/service";
import { parseSearchParams } from "@/server/lib/query";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Noticias" };

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = parseSearchParams(postQuerySchema, sp, { perPage: "9" });
  const [{ items, meta }, cats] = await Promise.all([listPosts(q), listPostCategories(true)]);
  const [first, ...rest] = items;
  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2">Blog</p>
          <h1 className="section-title">Noticias e ideas</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/noticias" className={cn("chip border", !q.category ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated")}>Todas</Link>
          {cats.map((c) => (
            <Link key={c.id} href={`/noticias?category=${c.slug}`} className={cn("chip border", q.category === c.slug ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-elevated")}>{c.name} ({c._count.posts})</Link>
          ))}
        </div>
      </div>
      {first && q.page === 1 && <PostCard p={first} horizontal className="mb-6" />}
      <div className="grid gap-5 md:grid-cols-3">
        {(q.page === 1 ? rest : items).map((p) => <PostCard key={p.id} p={p} />)}
      </div>
      <Pagination page={meta.page} totalPages={meta.totalPages} className="mt-10" />
    </div>
  );
}
