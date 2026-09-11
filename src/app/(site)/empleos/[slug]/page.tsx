import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock, Banknote } from "lucide-react";
import { getCareerBySlug } from "@/server/modules/careers/service";
import { HttpError } from "@/server/errors";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ApplyForm } from "@/components/site/apply-form";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await getCareerBySlug(slug);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  return { title: c?.title ?? "Vacante" };
}

export default async function CareerPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await load((await params).slug);
  if (!c) notFound();
  return (
    <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="eyebrow mb-2">Vacante</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{c.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-soft">
          {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-brand" /> {c.location}</span>}
          <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4 text-brand" /> {STATUS_LABELS[c.type]}</span>
          {c.salary && <span className="inline-flex items-center gap-1"><Banknote className="h-4 w-4 text-brand" /> {c.salary}</span>}
          {c.deadline && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-brand" /> Cierra {formatDate(c.deadline)}</span>}
        </div>
        {c.description && <p className="mt-6 text-lg text-ink-soft">{c.description}</p>}
        <div className="prose-content mt-4" dangerouslySetInnerHTML={{ __html: c.content ?? "" }} />
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <h3 className="mb-3 font-display text-lg font-bold">Postúlate</h3>
          <ApplyForm careerId={c.id} />
        </div>
      </aside>
    </div>
  );
}
