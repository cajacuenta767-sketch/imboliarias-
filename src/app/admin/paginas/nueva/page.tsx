import { PageHeader } from "@/components/ui/misc";
import { ContentForm } from "@/components/admin/content-form";
import { PAGE_FIELDS } from "@/components/admin/page-fields";

export default function NewPage() {
  return <div><PageHeader title="Nueva página" /><ContentForm endpoint="/api/v1/pages" backHref="/admin/paginas" fields={PAGE_FIELDS} initial={{ title: "", slug: "", template: "default", content: "", metaTitle: "", metaDescription: "", status: "PUBLISHED" }} /></div>;
}
