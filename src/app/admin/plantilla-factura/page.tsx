import { getSettings } from "@/server/modules/settings/service";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/admin/settings-form";
import { InvoiceView } from "@/components/shared/invoice-view";

export default async function InvoiceTemplatePage() {
  const s = await getSettings();
  const sample = { id: "x", number: `${s.invoice_prefix}-2026-0001`, status: "PAID", createdAt: new Date().toISOString(), paidAt: new Date().toISOString(), subtotal: 29, discount: 5.8, tax: 0, total: 23.2, currencyCode: "USD", package: { name: "Profesional", credits: 12, durationDays: 60 }, user: { name: "Cliente de ejemplo", email: "cliente@correo.test" }, payments: [{ gateway: "SANDBOX", reference: "sbx_demo", status: "COMPLETED", createdAt: new Date().toISOString() }], coupon: { code: "BIENVENIDO20" } };
  return (
    <div>
      <PageHeader title="Plantilla de factura" subtitle="Datos fiscales y textos que aparecen en todas las facturas." />
      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsForm values={s} sections={[{ title: "Datos del emisor", fields: [{ key: "invoice_company", label: "Razón social" }, { key: "invoice_nit", label: "NIT / identificación", half: true }, { key: "invoice_prefix", label: "Prefijo de numeración", half: true }, { key: "tax_percent", label: "Impuesto (%)", type: "number", half: true }, { key: "invoice_footer", label: "Texto al pie", type: "textarea" }] }]} />
        <div><p className="label">Vista previa</p><InvoiceView invoice={sample} settings={s} backHref="/admin" /></div>
      </div>
    </div>
  );
}
