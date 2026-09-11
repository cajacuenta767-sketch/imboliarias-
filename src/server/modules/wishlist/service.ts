import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { propertyCardInclude } from "@/server/modules/properties/service";

export const listWishlist = (userId: string) =>
  db.wishlist.findMany({
    where: { userId, property: { moderation: "APPROVED", status: { not: "HIDDEN" } } },
    include: { property: { include: propertyCardInclude } },
    orderBy: { createdAt: "desc" },
  });

export const wishlistIds = async (userId: string) => (await db.wishlist.findMany({ where: { userId }, select: { propertyId: true } })).map((w) => w.propertyId);

export async function toggleWishlist(userId: string, propertyId: string) {
  const existing = await db.wishlist.findUnique({ where: { userId_propertyId: { userId, propertyId } } });
  if (existing) {
    await db.wishlist.delete({ where: { userId_propertyId: { userId, propertyId } } });
    return { saved: false };
  }
  const p = await db.property.findUnique({ where: { id: propertyId }, select: { moderation: true, status: true } });
  if (!p || p.moderation !== "APPROVED" || p.status === "HIDDEN") throw notFound("Propiedad no disponible");
  await db.wishlist.create({ data: { userId, propertyId } }).catch((e: { code?: string }) => {
    if (e?.code !== "P2002") throw e; // doble clic: ya estaba guardada
  });
  return { saved: true };
}
