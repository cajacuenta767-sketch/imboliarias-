import { getPropertyFormOptions } from "@/server/modules/properties/form-options";
import { PageHeader } from "@/components/ui/misc";
import { PropertyForm } from "@/components/shared/property-form";
import { emptyPropertyValues } from "@/lib/property-form-values";

export default async function AdminNewProperty() {
  const options = await getPropertyFormOptions(true);
  return (
    <div>
      <PageHeader title="Nueva propiedad" />
      <PropertyForm initial={{ ...emptyPropertyValues, moderation: "APPROVED" }} options={options} mode="admin" backHref="/admin/propiedades" />
    </div>
  );
}
