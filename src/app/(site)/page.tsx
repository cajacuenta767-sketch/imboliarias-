import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck, Sparkles, MapPinned, Building2, Home as HomeIcon, Palmtree, Briefcase, Store, Map, TreePine, BedSingle, Star } from "lucide-react";
import { HeroSearch } from "@/components/site/hero-search";
import { PropertyGrid } from "@/components/site/property-card";
import { AgentCard, CityCard, PostCard, ProjectCard } from "@/components/site/cards";
import { SectionHeader } from "@/components/ui/misc";
import { SmartImage } from "@/components/ui/smart-image";
import { getSettings } from "@/server/modules/settings/service";
import { listCities, featuredCities } from "@/server/modules/locations/service";
import { listCategories } from "@/server/modules/categories/service";
import { featuredProperties, latestProperties } from "@/server/modules/properties/service";
import { featuredProjects } from "@/server/modules/projects/service";
import { featuredAgents } from "@/server/modules/agents/service";
import { latestPosts } from "@/server/modules/posts/service";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { Building2, Home: HomeIcon, Palmtree, Briefcase, Store, Map, TreePine, BedSingle };

export default async function HomePage() {
  const [t, s, cities, categories, featured, latestSale, latestRent, projects, agents, posts, fCities, stats, testimonials] = await Promise.all([
    getTranslations("home"),
    getSettings(),
    listCities(),
    listCategories(true),
    featuredProperties(8),
    latestProperties("SALE", 4),
    latestProperties("RENT", 4),
    featuredProjects(3),
    featuredAgents(4),
    latestPosts(3),
    featuredCities(),
    Promise.all([
      db.property.count({ where: { moderation: "APPROVED", status: "AVAILABLE" } }),
      db.city.count({ where: { isActive: true } }),
      db.agent.count(),
    ]),
    db.review.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" }, take: 3, include: { property: { select: { title: true, slug: true } } } }),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate min-h-[640px] overflow-hidden bg-ink text-white">
        <SmartImage src={s.hero_image} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,.35),transparent_55%)]" />
        <div className="container-x relative flex min-h-[640px] flex-col justify-center py-24">
          <p className="eyebrow mb-4 text-brand-glow animate-fade-up">{s.site_tagline}</p>
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl animate-fade-up">{s.hero_title}</h1>
          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg animate-fade-up-delay">{s.hero_subtitle}</p>
          <div className="mt-9 animate-fade-up-delay">
            <HeroSearch cities={cities} categories={categories} />
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [stats[0], t("stats.properties")],
              [stats[1], t("stats.cities")],
              [stats[2], t("stats.agents")],
              ["+2.4k", t("stats.clients")],
            ].map(([n, l]) => (
              <div key={String(l)} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="font-display text-2xl font-extrabold">{n}</p>
                <p className="text-xs text-white/75">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container-x -mt-10 relative z-10">
        <div className="card flex gap-3 overflow-x-auto p-3 scrollbar-thin">
          {categories.map((c) => {
            const Icon = ICONS[c.icon ?? ""] ?? Building2;
            return (
              <Link key={c.id} href={`/propiedades?category=${c.slug}`} className="group flex min-w-[130px] flex-1 flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition hover:bg-brand-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-brand transition group-hover:bg-brand group-hover:text-white"><Icon className="h-5 w-5" /></span>
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-xs text-ink-muted">{c._count.properties}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* DESTACADAS */}
      <section className="container-x mt-20">
        <SectionHeader eyebrow="Selección Habitta" title={t("featuredProperties")} subtitle={t("featuredPropertiesSub")} href="/propiedades?featured=true" />
        <PropertyGrid items={featured} />
      </section>

      {/* PROYECTOS */}
      {projects.length > 0 && (
        <section className="mt-24 bg-elevated py-20">
          <div className="container-x">
            <SectionHeader eyebrow="Obra nueva" title={t("featuredProjects")} subtitle={t("featuredProjectsSub")} href="/proyectos" />
            <div className="grid gap-5 lg:grid-cols-3">
              <ProjectCard p={projects[0]} large className="lg:col-span-2" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                {projects.slice(1, 3).map((p) => (
                  <ProjectCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CIUDADES */}
      <section className="container-x mt-24">
        <SectionHeader eyebrow="Ubicaciones" title={t("cities")} subtitle={t("citiesSub")} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {fCities.map((c, i) => (
            <CityCard key={c.id} c={c} className={i === 0 ? "col-span-2 row-span-2 aspect-auto" : ""} />
          ))}
        </div>
      </section>

      {/* RECIENTES */}
      <section className="container-x mt-24 grid gap-14 lg:grid-cols-2">
        <div>
          <SectionHeader title={t("latestSale")} href="/propiedades?type=SALE" />
          <PropertyGrid items={latestSale} cols={2} hideAgent />
        </div>
        <div>
          <SectionHeader title={t("latestRent")} href="/propiedades?type=RENT" />
          <PropertyGrid items={latestRent} cols={2} hideAgent />
        </div>
      </section>

      {/* POR QUÉ */}
      <section className="container-x mt-24">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Propiedades verificadas", text: "Cada publicación pasa por moderación para que no pierdas tiempo con anuncios falsos." },
            { icon: MapPinned, title: "Búsqueda por mapa", text: "Explora por zonas, filtra por precio, área y características, y guarda tus favoritas." },
            { icon: Sparkles, title: "Asesores de verdad", text: "Personas que conocen el barrio y te acompañan de la visita a la firma." },
          ].map((f) => (
            <div key={f.title} className="card p-7">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><f.icon className="h-6 w-6" /></span>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AGENTES */}
      <section className="container-x mt-24">
        <SectionHeader eyebrow="Equipo" title={t("agents")} subtitle={t("agentsSub")} href="/agentes" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <AgentCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      {testimonials.length > 0 && (
        <section className="mt-24 bg-ink py-20 text-white">
          <div className="container-x">
            <SectionHeader title={t("testimonials")} className="[&_h2]:text-white" />
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((r) => (
                <figure key={r.id} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-white/85">“{r.comment}”</blockquote>
                  <figcaption className="mt-4 text-xs text-white/60">
                    <span className="font-semibold text-white">{r.authorName}</span> · <Link href={`/propiedades/${r.property.slug}`} className="hover:text-brand-glow">{r.property.title}</Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BLOG */}
      <section className="container-x mt-24">
        <SectionHeader eyebrow="Blog" title={t("news")} subtitle={t("newsSub")} href="/noticias" />
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x mt-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand px-8 py-14 text-white sm:px-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-accent/30 blur-2xl" />
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{t("ctaTitle")}</h2>
            <p className="mt-3 text-white/85">{t("ctaText")}</p>
            <Link href="/cuenta/propiedades/nueva" className="btn mt-7 bg-white text-brand-strong hover:bg-brand-soft">
              {t("ctaButton")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
