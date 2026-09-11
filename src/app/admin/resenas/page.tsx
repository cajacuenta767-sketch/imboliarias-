import { listReviews, reviewQuerySchema } from "@/server/modules/reviews/service";
import { PageHeader } from "@/components/ui/misc";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { parseSearchParams } from "@/server/lib/query";

export default async function AdminReviews({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = parseSearchParams(reviewQuerySchema, await searchParams, { perPage: "15" });
  const { items, meta } = await listReviews(q);
  return <div><PageHeader title="Reseñas" subtitle="Aprueba o rechaza las opiniones de los visitantes." /><ReviewsTable rows={JSON.parse(JSON.stringify(items))} meta={meta} /></div>;
}
