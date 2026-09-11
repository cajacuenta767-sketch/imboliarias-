"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/hooks/use-currency";

type Inv = { id: string; number: string; status: string; createdAt: string; paidAt?: string | null; subtotal: number; discount: number; tax: number; taxPercent?: number; total: number; currencyCode: string; package?: { name: string; credits: number; durationDays: number } | null; user: { name: string; email: string; phone?: string | null }; payments: { gateway: string; reference?: string | null; status: string; createdAt: string }[]; coupon?: { code: string } | null };

export function InvoiceView({ invoice: inv, settings: s, backHref = "/cuenta/facturas" }: { invoice: Inv; settings: Record<string, string>; backHref?: string }) {
  const { format } = useCurrency();
  // La factura se muestra siempre en su propia moneda y con el impuesto vigente al emitirla.
  const money = (n: number) => `${inv.currencyCode} ${format(n, inv.currencyCode).replace(/^[^\d-]+/, "")}`;
  const taxPercent = inv.taxPercent ?? s.tax_percent;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={backHref} className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        <button onClick={() => window.print()} className="btn-primary"><Printer className="h-4 w-4" /> Imprimir / PDF</button>
      </div>
      <div className="card mx-auto max-w-3xl p-8 print:border-0 print:shadow-none sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-display text-2xl font-extrabold"><LogoMark /> {s.site_name}</div>
            <p className="mt-2 text-sm text-ink-soft">{s.invoice_company}<br />NIT {s.invoice_nit}<br />{s.contact_address}<br />{s.contact_email}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Factura</p>
            <p className="font-display text-2xl font-extrabold">{inv.number}</p>
            <p className="text-sm text-ink-soft">Emitida {formatDate(inv.createdAt)}</p>
            {inv.paidAt && <p className="text-sm text-ink-soft">Pagada {formatDate(inv.paidAt)}</p>}
            <div className="mt-2"><StatusBadge value={inv.status} /></div>
          </div>
        </div>
        <div className="mt-8 rounded-xl bg-muted p-4 text-sm">
          <p className="eyebrow mb-1">Cliente</p>
          <p className="font-semibold">{inv.user.name}</p>
          <p className="text-ink-soft">{inv.user.email}{inv.user.phone ? ` · ${inv.user.phone}` : ""}</p>
        </div>
        <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-ink-soft"><tr><th className="py-2">Concepto</th><th className="py-2 text-right">Cant.</th><th className="py-2 text-right">Precio</th></tr></thead>
          <tbody>
            <tr className="border-b border-line"><td className="py-3"><p className="font-semibold">Paquete {inv.package?.name}</p><p className="text-xs text-ink-muted">{inv.package?.credits} créditos · vigencia {inv.package?.durationDays} días</p></td><td className="py-3 text-right">1</td><td className="py-3 text-right">{money(inv.subtotal)}</td></tr>
          </tbody>
        </table>
        </div>
        <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{money(inv.subtotal)}</span></div>
          {inv.discount > 0 && <div className="flex justify-between text-success"><span>Descuento {inv.coupon ? `(${inv.coupon.code})` : ""}</span><span>- {money(inv.discount)}</span></div>}
          {inv.tax > 0 && <div className="flex justify-between"><span className="text-ink-soft">Impuestos ({taxPercent}%)</span><span>{money(inv.tax)}</span></div>}
          <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold"><span>Total</span><span>{money(inv.total)}</span></div>
        </div>
        {inv.payments.length > 0 && (
          <div className="mt-8 text-xs text-ink-soft">
            <p className="eyebrow mb-1">Pagos</p>
            {inv.payments.map((p, i) => <p key={i}>{formatDate(p.createdAt)} · {p.gateway} · {p.reference ?? "—"} · <StatusBadge value={p.status} /></p>)}
          </div>
        )}
        <p className="mt-10 border-t border-line pt-4 text-center text-xs text-ink-muted">{s.invoice_footer}</p>
      </div>
    </div>
  );
}
