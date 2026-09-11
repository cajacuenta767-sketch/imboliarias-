"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Sparkles, TicketPercent, ShieldCheck } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Price } from "@/components/site/price";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Pkg = { id: string; name: string; description?: string | null; price: number; currencyCode: string; credits: number; durationDays: number; isFeaturedListing: boolean; isPopular: boolean };
type Totals = { subtotal: number; discount: number; tax: number; total: number };

export function PackagesGrid({ packages, taxPercent }: { packages: Pkg[]; taxPercent: number }) {
  const router = useRouter();
  const [sel, setSel] = useState<Pkg | null>(null);
  const [coupon, setCoupon] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(false);

  const open = (p: Pkg) => {
    setSel(p);
    setCoupon("");
    const tax = Math.round(p.price * taxPercent) / 100;
    setTotals({ subtotal: p.price, discount: 0, tax, total: p.price + tax });
  };
  const applyCoupon = async () => {
    if (!sel || !coupon) return;
    try {
      const r = await apiPost<{ totals: Totals }>("/api/v1/coupons/validate", { code: coupon, packageId: sel.id });
      setTotals(r.data.totals);
      toast.success("Cupón aplicado");
    } catch (e) { toast.error((e as Error).message); }
  };
  const pay = async () => {
    if (!sel) return;
    setLoading(true);
    try {
      const r = await apiPost<{ id: string; status: string; number: string }>("/api/v1/invoices/checkout", { packageId: sel.id, coupon: coupon || null });
      toast.success(r.data.status === "PAID" ? `¡Pago aprobado! Factura ${r.data.number}` : `Factura ${r.data.number} creada, pendiente de pago`);
      setSel(null);
      router.push(`/cuenta/facturas/${r.data.id}`);
      router.refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {packages.map((p) => (
          <div key={p.id} className={cn("card relative flex flex-col p-6", p.isPopular && "border-brand ring-2 ring-brand/30")}>
            {p.isPopular && <span className="absolute -top-3 left-6 chip bg-brand text-white"><Sparkles className="h-3 w-3" /> Más popular</span>}
            <h3 className="font-display text-xl font-bold">{p.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{p.description}</p>
            <p className="mt-5"><Price amount={p.price} currencyCode={p.currencyCode} className="text-4xl" /></p>
            <ul className="mt-5 space-y-2 text-sm">
              {[`${p.credits} créditos para publicar`, `Publicaciones vigentes ${p.durationDays} días`, p.isFeaturedListing ? "Incluye listados destacados" : "Listados estándar", "Soporte por WhatsApp"].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> {f}</li>
              ))}
            </ul>
            <button onClick={() => open(p)} className={cn("mt-6 w-full", p.isPopular ? "btn-primary" : "btn-outline")}>Comprar</button>
          </div>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title="Confirmar compra" size="sm">
        {sel && totals && (
          <div className="space-y-4 p-5">
            <div className="rounded-xl bg-muted p-4"><p className="font-display font-bold">{sel.name}</p><p className="text-sm text-ink-soft">{sel.credits} créditos · {sel.durationDays} días</p></div>
            <div className="flex gap-2">
              <span className="relative flex-1"><TicketPercent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" /><input className="input pl-9 uppercase" placeholder="Cupón" value={coupon} onChange={(e) => setCoupon(e.target.value)} /></span>
              <button onClick={applyCoupon} className="btn-outline">Aplicar</button>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd><Price amount={totals.subtotal} currencyCode={sel.currencyCode} className="text-sm" /></dd></div>
              {totals.discount > 0 && <div className="flex justify-between text-success"><dt>Descuento</dt><dd>- <Price amount={totals.discount} currencyCode={sel.currencyCode} className="text-sm" /></dd></div>}
              {totals.tax > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Impuestos</dt><dd><Price amount={totals.tax} currencyCode={sel.currencyCode} className="text-sm" /></dd></div>}
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd><Price amount={totals.total} currencyCode={sel.currencyCode} /></dd></div>
            </dl>
            <button onClick={pay} disabled={loading} className="btn-primary w-full">{loading ? <Spinner /> : <ShieldCheck className="h-4 w-4" />} Pagar ahora</button>
            <p className="text-center text-xs text-ink-muted">Pasarela en modo sandbox: el pago se aprueba al instante.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
