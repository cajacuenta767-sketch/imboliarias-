import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Globe, BadgeCheck } from "lucide-react";
import { InstagramIcon as Instagram, LinkedinIcon as Linkedin, FacebookIcon as Facebook } from "@/components/ui/social-icons";
import { Avatar } from "@/components/ui/avatar";
import { PropertyGrid } from "@/components/site/property-card";
import { InquiryForm } from "@/components/site/forms";
import { getAgentBySlug } from "@/server/modules/agents/service";
import { HttpError } from "@/server/errors";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await getAgentBySlug(slug);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await load((await params).slug);
  return { title: a ? `${a.user.name} · Asesor` : "Agente" };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await load((await params).slug);
  if (!a) notFound();
  const socials = [[a.instagram, Instagram], [a.linkedin, Linkedin], [a.facebook, Facebook], [a.website, Globe]] as const;
  return (
    <div className="container-x py-10">
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-7 text-center">
            <Avatar src={a.user.avatarUrl} name={a.user.name} size="xl" className="mx-auto h-28 w-28 ring-4 ring-brand-soft" />
            <h1 className="mt-4 flex items-center justify-center gap-1 font-display text-2xl font-extrabold">{a.user.name} <BadgeCheck className="h-5 w-5 text-brand" /></h1>
            <p className="text-brand">{a.title ?? "Asesor inmobiliario"}</p>
            {a.agency && <p className="text-sm text-ink-muted">{a.agency}</p>}
            {a.city && <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-soft"><MapPin className="h-4 w-4" /> {a.city.name}</p>}
            <div className="mt-5 grid gap-2 text-left text-sm">
              {a.user.phone && <a href={`tel:${a.user.phone}`} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 hover:text-brand"><Phone className="h-4 w-4 text-brand" /> {a.user.phone}</a>}
              {a.user.email && <a href={`mailto:${a.user.email}`} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 hover:text-brand"><Mail className="h-4 w-4 text-brand" /> {a.user.email}</a>}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {socials.map(([url, Icon], i) => url ? <a key={i} href={url} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft hover:bg-brand hover:text-white"><Icon className="h-4 w-4" /></a> : null)}
            </div>
            {a.whatsapp && <a href={`https://wa.me/${a.whatsapp}`} target="_blank" rel="noreferrer" className="btn mt-5 w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]">Escribir por WhatsApp</a>}
          </div>
          <div className="card p-6">
            <h3 className="mb-3 font-display font-bold">Contactar a {a.user.name.split(" ")[0]}</h3>
            <InquiryForm defaultMessage={`Hola ${a.user.name.split(" ")[0]}, me gustaría recibir asesoría.`} compact />
          </div>
        </aside>
        <div>
          {a.bio && (
            <div className="card p-7">
              <h2 className="mb-2 font-display text-xl font-bold">Sobre mí</h2>
              <p className="leading-relaxed text-ink-soft">{a.bio}</p>
            </div>
          )}
          <h2 className="mb-5 mt-10 font-display text-2xl font-extrabold">Propiedades de {a.user.name.split(" ")[0]} ({a._count.properties})</h2>
          <PropertyGrid items={a.properties} cols={3} hideAgent />
        </div>
      </div>
    </div>
  );
}
