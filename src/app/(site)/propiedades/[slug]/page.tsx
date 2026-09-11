import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, MapPin } from "lucide-react";
import { PropertyDetail } from "@/components/site/property-detail";
import { InquiryForm, ReviewForm } from "@/components/site/forms";
import { PropertyGrid } from "@/components/site/property-card";
import { Price } from "@/components/site/price";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { SectionHeader } from "@/components/ui/misc";
import { getPropertyBySlug, similarProperties } from "@/server/modules/properties/service";
import { ratingSummary } from "@/server/modules/reviews/service";
import { currentUser } from "@/server/auth/guards";
import { formatDate, stripHtml, truncate } from "@/lib/utils";
import { SITE_URL } from "@/lib/constants";
import { HttpError } from "@/server/errors";

export const dynamic = "force-dynamic";

// `cache` deduplica la consulta entre generateMetadata y la página: una sola lectura y una sola vista contada.
const load = cache(async (slug: string) => {
  try {
    const user = await currentUser();
    return await getPropertyBySlug(slug, { countView: true, user });
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return { title: "Propiedad no encontrada" };
  const desc = p.description ?? truncate(stripHtml(p.content), 160);
  return { title: p.title, description: desc, openGraph: { title: p.title, description: desc, images: p.images[0] ? [{ url: p.images[0].url }] : [] } };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const [t, rating, similar] = await Promise.all([getTranslations("property"), ratingSummary(p.id), similarProperties(p)]);
  const agentUser = p.agent?.user ?? p.author;
  const whatsapp = p.agent?.whatsapp ?? agentUser.phone;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": p.type === "RENT" ? "Apartment" : "Residence",
    name: p.title,
    description: p.description,
    url: `${SITE_URL}/propiedades/${p.slug}`,
    image: p.images.map((i) => i.url),
    address: { "@type": "PostalAddress", addressLocality: p.city?.name, addressRegion: p.city?.state.name, addressCountry: p.city?.state.country.code },
    offers: { "@type": "Offer", price: p.price, priceCurrency: p.currencyCode },
    ...(p.lat && p.lng ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } } : {}),
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-4 text-xs text-ink-muted">
        <Link href="/" className="hover:text-brand">Inicio</Link> / <Link href={`/propiedades?type=${p.type}`} className="hover:text-brand">{p.type === "SALE" ? "Venta" : "Alquiler"}</Link> / <span className="text-ink">{p.title}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <PropertyDetail p={p} rating={rating}>
            {p.reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.authorName} size="md" />
                    <div>
                      <p className="text-sm font-bold">{r.authorName}</p>
                      <p className="text-xs text-ink-muted">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-3 text-sm text-ink-soft">{r.comment}</p>
              </div>
            ))}
            <ReviewForm propertyId={p.id} />
          </PropertyDetail>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Precio</p>
            <Price amount={p.price} currencyCode={p.currencyCode} period={p.period} type={p.type} className="text-3xl text-brand-strong" />
            {p.area ? (
              <p className="mt-1 text-xs text-ink-muted">
                ≈ <Price amount={p.price / p.area} currencyCode={p.currencyCode} className="text-xs" /> / m²
              </p>
            ) : null}
            <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
              <Avatar src={agentUser.avatarUrl} name={agentUser.name} size="lg" />
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate font-display font-bold">{agentUser.name} <BadgeCheck className="h-4 w-4 text-brand" /></p>
                <p className="truncate text-xs text-ink-muted">{p.agent?.title ?? "Asesor"}{p.agent?.agency ? ` · ${p.agent.agency}` : ""}</p>
                {p.agent && <Link href={`/agentes/${p.agent.slug}`} className="text-xs font-semibold text-brand hover:underline">Ver perfil</Link>}
              </div>
            </div>
            <div className="mt-5">
              <h3 className="mb-3 font-display font-bold">{t("contactAgent")}</h3>
              <InquiryForm propertyId={p.id} defaultMessage={`${t("contactIntro")} (${p.title} · ${p.uniqueId})`} whatsapp={whatsapp} phone={agentUser.phone} compact />
            </div>
          </div>
          {p.project && (
            <Link href={`/proyectos/${p.project.slug}`} className="card flex items-center gap-3 p-4 hover:border-brand">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><MapPin className="h-5 w-5" /></span>
              <div><p className="text-xs text-ink-muted">Parte del proyecto</p><p className="font-semibold">{p.project.name}</p></div>
            </Link>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <SectionHeader title={t("similar")} href={`/propiedades?type=${p.type}${p.city ? `&city=${p.city.slug}` : ""}`} />
          <PropertyGrid items={similar} />
        </section>
      )}
    </div>
  );
}
