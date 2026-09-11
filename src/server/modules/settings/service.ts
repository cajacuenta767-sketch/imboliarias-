import { db } from "@/server/db";

export const DEFAULT_SETTINGS: Record<string, { value: string; group: string }> = {
  site_name: { value: "Habitta", group: "general" },
  site_tagline: { value: "Encuentra el lugar donde tu vida sucede", group: "general" },
  site_description: { value: "Portal inmobiliario para comprar, vender y alquilar propiedades en Colombia.", group: "seo" },
  logo_url: { value: "", group: "appearance" },
  primary_color: { value: "#0f766e", group: "appearance" },
  accent_color: { value: "#d97706", group: "appearance" },
  hero_image: { value: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80", group: "appearance" },
  hero_title: { value: "El hogar que buscas, más cerca de lo que imaginas", group: "appearance" },
  hero_subtitle: { value: "Miles de propiedades verificadas en las mejores ciudades de Colombia.", group: "appearance" },
  contact_email: { value: "hola@habitta.test", group: "contact" },
  contact_phone: { value: "+57 300 000 0000", group: "contact" },
  contact_whatsapp: { value: "573000000000", group: "contact" },
  contact_address: { value: "Cra 43A #1-50, Medellín, Colombia", group: "contact" },
  social_facebook: { value: "https://facebook.com", group: "social" },
  social_instagram: { value: "https://instagram.com", group: "social" },
  social_youtube: { value: "https://youtube.com", group: "social" },
  social_tiktok: { value: "", group: "social" },
  default_currency: { value: "USD", group: "general" },
  default_locale: { value: "es", group: "general" },
  listing_days: { value: "45", group: "general" },
  credits_per_listing: { value: "1", group: "general" },
  credits_per_featured: { value: "2", group: "general" },
  free_credits_on_signup: { value: "2", group: "general" },
  moderation_required: { value: "true", group: "general" },
  tax_percent: { value: "0", group: "payments" },
  invoice_prefix: { value: "HB", group: "payments" },
  invoice_company: { value: "Habitta S.A.S.", group: "payments" },
  invoice_nit: { value: "900.000.000-1", group: "payments" },
  invoice_footer: { value: "Gracias por confiar en Habitta.", group: "payments" },
  footer_text: { value: "Habitta es la forma más simple de encontrar, publicar y vender propiedades.", group: "appearance" },
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  const out: Record<string, string> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) out[k] = DEFAULT_SETTINGS[k].value;
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function getSetting(key: string) {
  const s = await getSettings();
  return s[key];
}

export async function updateSettings(values: Record<string, string>) {
  const ops = Object.entries(values).map(([key, value]) =>
    db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: DEFAULT_SETTINGS[key]?.group ?? "general" },
    }),
  );
  await db.$transaction(ops);
  return getSettings();
}
