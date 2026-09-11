import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/server/modules/pages/service";
import { HttpError } from "@/server/errors";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await getPageBySlug(slug);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  return { title: p?.metaTitle ?? p?.title ?? "Página", description: p?.metaDescription ?? undefined };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  return (
    <div className={cn("container-x py-12", p.template !== "full-width" && "max-w-3xl")}>
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">{p.title}</h1>
      <div className="prose-content mt-8 text-base" dangerouslySetInnerHTML={{ __html: p.content ?? "" }} />
    </div>
  );
}
