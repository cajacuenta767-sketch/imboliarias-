"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Building2, Coins, Receipt, MessageSquare, Heart, UserCircle, Plus, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/cuenta", label: "Resumen", icon: LayoutDashboard },
  { href: "/cuenta/propiedades", label: "Mis propiedades", icon: Building2 },
  { href: "/cuenta/creditos", label: "Créditos y paquetes", icon: Coins },
  { href: "/cuenta/facturas", label: "Facturas", icon: Receipt },
  { href: "/cuenta/consultas", label: "Consultas recibidas", icon: MessageSquare },
  { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta/perfil", label: "Mi perfil", icon: UserCircle },
];

export function AccountShell({ children, credits, role }: { children: React.ReactNode; credits: number; role: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const active = (href: string) => (href === "/cuenta" ? pathname === "/cuenta" : pathname.startsWith(href));
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5 text-center">
          <Avatar src={session?.user?.image} name={session?.user?.name ?? "U"} size="xl" className="mx-auto" />
          <p className="mt-3 font-display font-bold">{session?.user?.name}</p>
          <p className="text-xs text-ink-muted">{session?.user?.email}</p>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-accent-strong"><Coins className="h-4 w-4" /> Créditos</span>
            <b className="font-display text-lg text-accent-strong">{credits}</b>
          </div>
          <Link href="/cuenta/propiedades/nueva" className="btn-primary mt-3 w-full"><Plus className="h-4 w-4" /> Publicar propiedad</Link>
        </div>
        <nav className="card flex flex-row overflow-x-auto p-2 lg:flex-col scrollbar-thin">
          {ITEMS.map((it) => (
            <Link key={it.href} href={it.href} className={cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-muted hover:text-ink", active(it.href) && "bg-brand-soft text-brand-strong")}>
              <it.icon className="h-4 w-4" /> {it.label}
            </Link>
          ))}
          {role === "ADMIN" && <Link href="/admin" className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-muted"><ShieldCheck className="h-4 w-4" /> Panel admin</Link>}
          <button onClick={() => signOut({ callbackUrl: "/" })} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-red-50"><LogOut className="h-4 w-4" /> Salir</button>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
