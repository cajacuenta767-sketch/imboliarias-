import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { PropertyGrid } from "@/components/site/property-card";
import { EmptyState } from "@/components/ui/misc";
import { currentUser } from "@/server/auth/guards";
import { listWishlist } from "@/server/modules/wishlist/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Favoritos" };

export default async function WishlistPage() {
  const user = await currentUser();
  const items = user ? (await listWishlist(user.id)).map((w) => w.property) : [];
  return (
    <div className="container-x py-10">
      <p className="eyebrow mb-2">Tu lista</p>
      <h1 className="section-title mb-8">Propiedades guardadas</h1>
      {!user ? (
        <EmptyState icon={Heart} title="Inicia sesión para ver tus favoritos" action={<Link href="/ingresar?next=/favoritos" className="btn-primary">Ingresar</Link>} />
      ) : items.length === 0 ? (
        <EmptyState icon={Heart} title="Aún no has guardado propiedades" text="Toca el corazón en cualquier propiedad para guardarla aquí." action={<Link href="/propiedades" className="btn-primary">Explorar propiedades</Link>} />
      ) : (
        <PropertyGrid items={items} />
      )}
    </div>
  );
}
