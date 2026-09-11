import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Eye } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/site/cards";
import { getPostBySlug, latestPosts } from "@/server/modules/posts/service";
import { HttpError } from "@/server/errors";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await getPostBySlug(slug, true);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  return { title: p?.title ?? "Artículo", description: p?.excerpt ?? undefined, openGraph: p?.coverUrl ? { images: [{ url: p.coverUrl }] } : undefined };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const more = (await latestPosts(4)).filter((x) => x.id !== p.id).slice(0, 3);
  return (
    <article className="py-10">
      <div className="container-x max-w-3xl">
        <nav className="mb-4 text-xs text-ink-muted"><Link href="/noticias" className="hover:text-brand">Noticias</Link>{p.category && <> / <span>{p.category.name}</span></>}</nav>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{p.title}</h1>
        {p.excerpt && <p className="mt-4 text-lg text-ink-soft">{p.excerpt}</p>}
        <div className="mt-5 flex items-center gap-4 text-sm text-ink-muted">
          {p.author && <span className="inline-flex items-center gap-2"><Avatar src={p.author.avatarUrl} name={p.author.name} size="sm" /> {p.author.name}</span>}
          {p.publishedAt && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(p.publishedAt)}</span>}
          <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {p.views}</span>
        </div>
      </div>
      {p.coverUrl && (
        <div className="container-x mt-8"><div className="aspect-[21/9] overflow-hidden rounded-3xl"><SmartImage src={p.coverUrl} alt={p.title} className="h-full w-full" /></div></div>
      )}
      <div className="container-x mt-10 max-w-3xl">
        <div className="prose-content text-base" dangerouslySetInnerHTML={{ __html: p.content ?? "" }} />
        {p.tags && <div className="mt-8 flex flex-wrap gap-2">{p.tags.split(",").map((t) => <span key={t} className="chip bg-muted text-ink-soft">#{t.trim()}</span>)}</div>}
      </div>
      {more.length > 0 && (
        <div className="container-x mt-20">
          <h2 className="mb-5 font-display text-2xl font-extrabold">Sigue leyendo</h2>
          <div className="grid gap-5 md:grid-cols-3">{more.map((m) => <PostCard key={m.id} p={m} />)}</div>
        </div>
      )}
    </article>
  );
}
