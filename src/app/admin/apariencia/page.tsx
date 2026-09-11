import { getSettings } from "@/server/modules/settings/service";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AppearancePage() {
  const s = await getSettings();
  return (
    <div>
      <PageHeader title="Apariencia" subtitle="Logo, portada y textos visibles del sitio público." />
      <SettingsForm values={s} sections={[
        { title: "Marca", fields: [{ key: "logo_url", label: "Logo", type: "image", hint: "Si se deja vacío se usa el logotipo Habitta." }, { key: "primary_color", label: "Color principal", type: "color", half: true }, { key: "accent_color", label: "Color de acento", type: "color", half: true }] },
        { title: "Portada (hero)", fields: [{ key: "hero_image", label: "Imagen de fondo", type: "image" }, { key: "hero_title", label: "Título" }, { key: "hero_subtitle", label: "Subtítulo", type: "textarea" }] },
        { title: "Pie de página", fields: [{ key: "footer_text", label: "Texto descriptivo", type: "textarea" }] },
      ]} />
    </div>
  );
}
