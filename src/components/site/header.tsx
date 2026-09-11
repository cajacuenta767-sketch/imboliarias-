"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDialog } from "@/lib/hooks/use-dialog";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Heart, Menu, Plus, X, User, LayoutDashboard, LogOut, ChevronDown, Phone, Mail } from "lucide-react";
import { FacebookIcon as Facebook, InstagramIcon as Instagram, YoutubeIcon as Youtube } from "@/components/ui/social-icons";
import { Logo } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { CurrencySwitch, LangSwitch } from "@/components/site/switchers";
import { useSettings } from "@/lib/hooks/use-settings";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("nav");
  const s = useSettings();
  const tc = useTranslations("common");
  const pathname = usePathname();
  const sp = useSearchParams();
  const { data: session } = useSession();
  const { ids } = useWishlist();
  const [open, setOpen] = useState(false);
  const drawerRef = useDialog(open, () => setOpen(false));
  const user = session?.user;

  const links = [
    { href: "/propiedades?type=SALE", label: t("buy") },
    { href: "/propiedades?type=RENT", label: t("rent") },
    { href: "/proyectos", label: t("projects") },
    { href: "/agentes", label: t("agents") },
    { href: "/noticias", label: t("blog") },
    { href: "/contacto", label: t("contact") },
  ];
  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return true;
    const want = new URLSearchParams(query);
    return Array.from(want.entries()).every(([k, v]) => sp.get(k) === v);
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Barra superior */}
      <div className="hidden bg-ink text-xs text-white/80 md:block">
        <div className="container-x flex h-9 items-center justify-between">
          <div className="flex items-center gap-5">
            <a href={`tel:${s.contact_phone}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" /> {s.contact_phone}</a>
            <a href={`mailto:${s.contact_email}`} className="inline-flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5" /> {s.contact_email}</a>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {s.social_facebook && <a href={s.social_facebook} aria-label="Facebook" className="hover:text-white"><Facebook className="h-3.5 w-3.5" /></a>}
              {s.social_instagram && <a href={s.social_instagram} aria-label="Instagram" className="hover:text-white"><Instagram className="h-3.5 w-3.5" /></a>}
              {s.social_youtube && <a href={s.social_youtube} aria-label="YouTube" className="hover:text-white"><Youtube className="h-3.5 w-3.5" /></a>}
            </div>
            <span className="h-4 w-px bg-white/20" />
            <LangSwitch dark />
            <CurrencySwitch dark />
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <div className="border-b border-line/70 bg-bg/85 backdrop-blur-xl">
        <div className="container-x flex h-[72px] items-center justify-between gap-6">
          <Logo name={s.site_name} src={s.logo_url} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn("rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-muted hover:text-ink", isActive(l.href) && "bg-brand-soft text-brand-strong")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/favoritos" className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-muted sm:inline-flex" aria-label={t("wishlist")}>
              <Heart className="h-5 w-5" />
              {ids.size > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{ids.size}</span>}
            </Link>
            <Link href={user ? "/cuenta/propiedades/nueva" : "/ingresar?next=/cuenta/propiedades/nueva"} className="btn-primary hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> {t("addProperty")}
            </Link>
            {user ? (
              <Dropdown
                label={t("account")}
                trigger={
                  <button className="flex items-center gap-2 rounded-full border border-line bg-elevated py-1 pl-1 pr-2.5 hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                    <Avatar src={user.image} name={user.name ?? "U"} size="sm" />
                    <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />
                  </button>
                }
              >
                <div className="border-b border-line px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user.email}</p>
                </div>
                <DropdownItem href="/cuenta"><User className="h-4 w-4" /> {t("account")}</DropdownItem>
                {user.role === "ADMIN" && <DropdownItem href="/admin"><LayoutDashboard className="h-4 w-4" /> {t("admin")}</DropdownItem>}
                <DropdownItem href="/favoritos"><Heart className="h-4 w-4" /> {t("wishlist")}</DropdownItem>
                <DropdownItem onClick={() => signOut({ callbackUrl: "/" })} className="text-danger"><LogOut className="h-4 w-4" /> {t("logout")}</DropdownItem>
              </Dropdown>
            ) : (
              <Link href="/ingresar" className="btn-outline hidden sm:inline-flex">{t("login")}</Link>
            )}
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label={tc("menu")} aria-expanded={open} aria-haspopup="dialog">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label={tc("menu")} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-elevated p-5 shadow-float animate-fade-up outline-none">
            <div className="flex items-center justify-between">
              <Logo name={s.site_name} src={s.logo_url} />
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted" aria-label={tc("close")}><X className="h-5 w-5" /></button>
            </div>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Principal">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-base font-semibold text-ink hover:bg-muted">{l.label}</Link>
              ))}
              <Link href="/favoritos" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-base font-semibold text-ink hover:bg-muted">{t("wishlist")}</Link>
            </nav>
            <div className="mt-auto space-y-3">
              <div className="flex items-center gap-3"><LangSwitch /><CurrencySwitch /></div>
              <Link href={user ? "/cuenta/propiedades/nueva" : "/ingresar"} onClick={() => setOpen(false)} className="btn-primary w-full"><Plus className="h-4 w-4" /> {t("addProperty")}</Link>
              {user ? (
                <Link href="/cuenta" onClick={() => setOpen(false)} className="btn-outline w-full">{t("account")}</Link>
              ) : (
                <Link href="/ingresar" onClick={() => setOpen(false)} className="btn-outline w-full">{t("login")}</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
