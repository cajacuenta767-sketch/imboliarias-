import { requireUser } from "@/server/auth/guards";
import { creditHistory, listPackages, resolveGateway } from "@/server/modules/billing/service";
import { getSettings } from "@/server/modules/settings/service";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { PackagesGrid } from "@/components/account/credits";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const REASONS: Record<string, string> = { PACKAGE_PURCHASE: "Compra de paquete", PROPERTY_PUBLISH: "Publicación", PROPERTY_FEATURE: "Destacar publicación", PROPERTY_RENEW: "Renovación", ADMIN_ADJUST: "Ajuste", REFUND: "Reembolso" };

export default async function CreditsPage() {
  const user = await requireUser();
  const [packages, history, settings, u] = await Promise.all([listPackages(), creditHistory(user.id), getSettings(), db.user.findUnique({ where: { id: user.id }, select: { credits: true } })]);
  return (
    <div>
      <PageHeader title="Créditos y paquetes" subtitle={`Tienes ${u?.credits ?? 0} créditos. Cada publicación cuesta ${settings.credits_per_listing} crédito(s); destacar cuesta ${settings.credits_per_featured} adicionales.`} />
      <PackagesGrid packages={packages} taxPercent={Number(settings.tax_percent ?? 0)} gateway={resolveGateway()} />
      <h2 className="mb-3 mt-10 font-display text-xl font-bold">Historial de créditos</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-ink-soft"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Concepto</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3 text-right">Créditos</th></tr></thead>
          <tbody className="divide-y divide-line">
            {history.map((h) => (
              <tr key={h.id}><td className="px-4 py-3 text-ink-soft">{formatDate(h.createdAt)}</td><td className="px-4 py-3">{REASONS[h.reason] ?? h.reason}</td><td className="px-4 py-3 text-ink-muted">{h.reference}</td><td className={cn("px-4 py-3 text-right font-bold tabular-nums", h.amount > 0 ? "text-success" : "text-danger")}>{h.amount > 0 ? "+" : ""}{h.amount}</td></tr>
            ))}
            {history.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">Sin movimientos.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
