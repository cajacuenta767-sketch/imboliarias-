"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard, FileText, Newspaper, Briefcase, Building2, FolderKanban, ListChecks, MapPinned, Landmark, Tags, Star, Receipt, FileSpreadsheet, SlidersHorizontal, MessageSquare, TicketPercent, Users, Package, Images, Palette, Settings, Coins, Globe, Menu, X, ExternalLink, LogOut, ChevronDown,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { group: "General", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }, { href: "/admin/consultas", label: "Consultas", icon: MessageSquare }, { href: "/admin/medios", label: "Biblioteca de medios", icon: Images }] },
  {
    group: "Bienes raíces",
    items: [
      { href: "/admin/propiedades", label: "Propiedades", icon: Building2 }, { href: "/admin/proyectos", label: "Proyectos", icon: FolderKanban }, { href: "/admin/categorias", label: "Categorías", icon: Tags }, { href: "/admin/caracteristicas", label: "Características", icon: ListChecks },
      { href: "/admin/instalaciones", label: "Instalaciones", icon: MapPinned }, { href: "/admin/inversores", label: "Inversores", icon: Landmark }, { href: "/admin/resenas", label: "Reseñas", icon: Star }, { href: "/admin/campos-personalizados", label: "Campos personalizados", icon: SlidersHorizontal }, { href: "/admin/ubicaciones", label: "Ubicaciones", icon: Globe },
    ],
  },
  { group: "Ventas", items: [{ href: "/admin/paquetes", label: "Paquetes", icon: Package }, { href: "/admin/facturas", label: "Facturas", icon: Receipt }, { href: "/admin/plantilla-factura", label: "Plantilla de factura", icon: FileSpreadsheet }, { href: "/admin/cupones", label: "Cupones", icon: TicketPercent }, { href: "/admin/monedas", label: "Monedas", icon: Coins }] },
  { group: "Contenido", items: [{ href: "/admin/paginas", label: "Páginas", icon: FileText }, { href: "/admin/blog", label: "Blog", icon: Newspaper }, { href: "/admin/empleos", label: "Carreras", icon: Briefcase }] },
  { group: "Sistema", items: [{ href: "/admin/cuentas", label: "Cuentas", icon: Users }, { href: "/admin/apariencia", label: "Apariencia", icon: Palette }, { href: "/admin/configuracion", label: "Configuración", icon: Settings }] },
];

export function AdminShell({ children, siteName, pending }: { children: React.ReactNode; siteName: string; pending: { moderation: number; inquiries: number } }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const badges: Record<string, number> = { "/admin/propiedades": pending.moderation, "/admin/consultas": pending.inquiries };
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="flex items-center gap-2.5 font-display text-lg font-extrabold text-white"><LogoMark className="h-8 w-8" /> {siteName}<span className="text-brand-glow">.</span></Link>
        <button onClick={() => setOpen(false)} className="text-white/60 lg:hidden"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 scrollbar-thin">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{g.group}</p>
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white", active(it.href) && "bg-brand text-white shadow-[0_8px_20px_-10px_rgba(20,184,166,.8)] hover:bg-brand")}>
                <it.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{it.label}</span>
                {badges[it.href] > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{badges[it.href]}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden bg-admin lg:block lg:h-screen lg:sticky lg:top-0">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-admin shadow-float">{sidebar}</div>
        </div>
      )}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-bg/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="Menú"><Menu className="h-5 w-5" /></button>
            <Link href="/" target="_blank" className="btn-outline py-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Ver sitio</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/consultas" className="relative rounded-full p-2 hover:bg-muted" title="Consultas nuevas">
              <MessageSquare className="h-5 w-5 text-ink-soft" />
              {pending.inquiries > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-bg" />}
            </Link>
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-full border border-line bg-elevated py-1 pl-1 pr-2.5"><Avatar src={session?.user?.image} name={session?.user?.name ?? "A"} size="sm" /><span className="hidden text-sm font-semibold sm:block">{session?.user?.name}</span><ChevronDown className="h-4 w-4 text-ink-muted" /></button>
              <div className="invisible absolute right-0 mt-2 w-48 rounded-xl border border-line bg-elevated p-1.5 opacity-0 shadow-float transition group-hover:visible group-hover:opacity-100">
                <Link href="/cuenta/perfil" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Mi perfil</Link>
                <Link href="/cuenta" className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">Mi cuenta</Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50"><LogOut className="h-4 w-4" /> Salir</button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
