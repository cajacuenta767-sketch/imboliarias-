import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth/guards";
import { getPropertyById } from "@/server/modules/properties/service";
import { getPropertyFormOptions } from "@/server/modules/properties/form-options";
import { getSettings } from "@/server/modules/settings/service";
import { db } from "@/server/db";
import { PageHeader } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { PropertyForm } from "@/components/shared/property-form";
import { toPropertyFormValues } from "@/lib/property-form-values";
import { HttpError } from "@/server/errors";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  let p;
  try { p = await getPropertyById(id); } catch (e) { if (e instanceof HttpError) notFound(); throw e; }
  if (p.authorId !== user.id && user.role !== "ADMIN") redirect("/cuenta/propiedades");
  const [options, settings, u] = await Promise.all([getPropertyFormOptions(false), getSettings(), db.user.findUnique({ where: { id: user.id }, select: { credits: true } })]);
  return (
    <div>
      <PageHeader title={p.title} subtitle={`Código ${p.uniqueId}`}><StatusBadge value={p.moderation} /><StatusBadge value={p.status} /></PageHeader>
      <PropertyForm id={p.id} initial={toPropertyFormValues(p)} options={options} mode="account" credits={u?.credits ?? 0} costs={{ listing: Number(settings.credits_per_listing), featured: Number(settings.credits_per_featured) }} backHref="/cuenta/propiedades" />
    </div>
  );
}
