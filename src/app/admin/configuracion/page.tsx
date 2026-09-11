import { getSettings } from "@/server/modules/settings/service";
import { listCurrencies } from "@/server/modules/currencies/service";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const [s, currencies] = await Promise.all([getSettings(), listCurrencies(false)]);
  return (
    <div>
      <PageHeader title="Configuración" subtitle="Ajustes generales del sistema." />
      <SettingsForm values={s} sections={[
        { title: "General", description: "Nombre, idioma y moneda por defecto.", fields: [{ key: "site_name", label: "Nombre del sitio", half: true }, { key: "site_tagline", label: "Eslogan", half: true }, { key: "site_description", label: "Descripción (SEO)", type: "textarea" }, { key: "default_locale", label: "Idioma por defecto", type: "select", half: true, options: [{ value: "es", label: "Español" }, { value: "en", label: "English" }] }, { key: "default_currency", label: "Moneda por defecto", type: "select", half: true, options: currencies.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` })) }] },
        { title: "Publicaciones y créditos", description: "Reglas para los agentes.", fields: [{ key: "moderation_required", label: "Requiere moderación antes de publicar", type: "boolean" }, { key: "listing_days", label: "Vigencia de cada publicación (días)", type: "number", half: true }, { key: "credits_per_listing", label: "Créditos por publicación", type: "number", half: true }, { key: "credits_per_featured", label: "Créditos extra por destacar", type: "number", half: true }, { key: "free_credits_on_signup", label: "Créditos de bienvenida", type: "number", half: true }] },
        { title: "Contacto", fields: [{ key: "contact_email", label: "Correo", half: true }, { key: "contact_phone", label: "Teléfono", half: true }, { key: "contact_whatsapp", label: "WhatsApp (solo números con indicativo)", half: true, hint: "Ej. 573001234567" }, { key: "contact_address", label: "Dirección", half: true }] },
        { title: "Redes sociales", fields: [{ key: "social_facebook", label: "Facebook", half: true }, { key: "social_instagram", label: "Instagram", half: true }, { key: "social_youtube", label: "YouTube", half: true }, { key: "social_tiktok", label: "TikTok", half: true }] },
      ]} />
    </div>
  );
}
