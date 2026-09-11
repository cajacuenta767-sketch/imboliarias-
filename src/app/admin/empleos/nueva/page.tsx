import { PageHeader } from "@/components/ui/misc";
import { ContentForm } from "@/components/admin/content-form";
import { CAREER_FIELDS } from "@/components/admin/page-fields";

export default function NewCareer() {
  return <div><PageHeader title="Nueva vacante" /><ContentForm endpoint="/api/v1/careers" backHref="/admin/empleos" fields={CAREER_FIELDS} initial={{ title: "", description: "", content: "", location: "", salary: "", type: "FULL_TIME", status: "OPEN", deadline: "" }} /></div>;
}
