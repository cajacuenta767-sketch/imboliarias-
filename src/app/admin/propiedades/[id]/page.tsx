import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getPropertyById } from "@/server/modules/properties/service";
import { getPropertyFormOptions } from "@/server/modules/properties/form-options";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { PropertyForm } from "@/components/shared/property-form";
import { toPropertyFormValues } from "@/lib/property-form-values";
import { HttpError } from "@/server/errors";

export default async function AdminEditProperty({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let p;
  try { p = await getPropertyById(id); } catch (e) { if (e instanceof HttpError) notFound(); throw e; }
  const options = await getPropertyFormOptions(true);
  return (
    <div>
      <PageHeader title={p.title} subtitle={`${p.uniqueId} · publicada por ${p.author.name}`}>
        <StatusBadge value={p.moderation} /><StatusBadge value={p.status} />
        <Link href={`/propiedades/${p.slug}`} target="_blank" className="btn-outline py-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Ver</Link>
      </PageHeader>
      <PropertyForm id={p.id} initial={toPropertyFormValues(p)} options={options} mode="admin" backHref="/admin/propiedades" />
    </div>
  );
}
