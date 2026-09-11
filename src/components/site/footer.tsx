import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail } from "lucide-react";
import { FacebookIcon as Facebook, InstagramIcon as Instagram, YoutubeIcon as Youtube, TiktokIcon } from "@/components/ui/social-icons";
import { Logo } from "@/components/ui/logo";
import { getSettings } from "@/server/modules/settings/service";
import { listPages } from "@/server/modules/pages/service";

export async function SiteFooter() {
  const [t, tn, s, pages] = await Promise.all([getTranslations("footer"), getTranslations("nav"), getSettings(), listPages(true)]);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-elevated">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo name={s.site_name} src={s.logo_url} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">{s.footer_text}</p>
          <div className="mt-5 flex gap-2">
            {s.social_facebook && <a href={s.social_facebook} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft hover:bg-brand hover:text-white" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>}
            {s.social_instagram && <a href={s.social_instagram} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft hover:bg-brand hover:text-white" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>}
            {s.social_youtube && <a href={s.social_youtube} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft hover:bg-brand hover:text-white" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>}
            {s.social_tiktok && <a href={s.social_tiktok} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft hover:bg-brand hover:text-white" aria-label="TikTok"><TiktokIcon className="h-4 w-4" /></a>}
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t("explore")}</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/propiedades?type=SALE" className="hover:text-brand">{tn("buy")}</Link></li>
            <li><Link href="/propiedades?type=RENT" className="hover:text-brand">{tn("rent")}</Link></li>
            <li><Link href="/proyectos" className="hover:text-brand">{tn("projects")}</Link></li>
            <li><Link href="/agentes" className="hover:text-brand">{tn("agents")}</Link></li>
            <li><Link href="/noticias" className="hover:text-brand">{tn("blog")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t("company")}</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            {pages.map((p) => (
              <li key={p.id}><Link href={`/${p.slug}`} className="hover:text-brand">{p.title}</Link></li>
            ))}
            <li><Link href="/empleos" className="hover:text-brand">{tn("careers")}</Link></li>
            <li><Link href="/contacto" className="hover:text-brand">{tn("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wider">{t("contact")}</h4>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {s.contact_address}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {s.contact_phone}</li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {s.contact_email}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row">
          <p>© {year} {s.site_name}. {t("rights")}</p>
          <p className="flex gap-4">
            <Link href="/terminos" className="hover:text-brand">{t("terms")}</Link>
            <Link href="/privacidad" className="hover:text-brand">{t("privacy")}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
