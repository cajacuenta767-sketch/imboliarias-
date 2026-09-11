import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/server/auth/guards";
import { listWishlist } from "@/server/modules/wishlist/service";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { PropertyGrid } from "@/components/site/property-card";

export default async function AccountWishlist() {
  const user = await requireUser();
  const items = (await listWishlist(user.id)).map((w) => w.property);
  return (
    <div>
      <PageHeader title="Favoritos" subtitle="Propiedades que guardaste para revisar después." />
      {items.length === 0 ? <EmptyState icon={Heart} title="Sin favoritos" action={<Link href="/propiedades" className="btn-primary">Explorar</Link>} /> : <PropertyGrid items={items} cols={3} />}
    </div>
  );
}
