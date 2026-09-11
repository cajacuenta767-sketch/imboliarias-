import { requireUser } from "@/server/auth/guards";
import { getPropertyFormOptions } from "@/server/modules/properties/form-options";
import { getSettings } from "@/server/modules/settings/service";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { PropertyForm } from "@/components/shared/property-form";
import { emptyPropertyValues } from "@/lib/property-form-values";

export default async function NewPropertyPage() {
  const user = await requireUser();
  const [options, settings, u] = await Promise.all([getPropertyFormOptions(false), getSettings(), db.user.findUnique({ where: { id: user.id }, select: { credits: true } })]);
  return (
    <div>
      <PageHeader title="Publicar propiedad" subtitle="Completa la información. Tu publicación pasará por una breve moderación antes de aparecer en el sitio." />
      <PropertyForm initial={emptyPropertyValues} options={options} mode="account" credits={u?.credits ?? 0} costs={{ listing: Number(settings.credits_per_listing), featured: Number(settings.credits_per_featured) }} backHref="/cuenta/propiedades" />
    </div>
  );
}
