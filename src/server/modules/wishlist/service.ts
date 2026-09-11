import { db } from "@/server/db";
import { propertyCardInclude } from "@/server/modules/properties/service";

export const listWishlist = (userId: string) =>
  db.wishlist.findMany({ where: { userId }, include: { property: { include: propertyCardInclude } }, orderBy: { createdAt: "desc" } });

export const wishlistIds = async (userId: string) => (await db.wishlist.findMany({ where: { userId }, select: { propertyId: true } })).map((w) => w.propertyId);

export async function toggleWishlist(userId: string, propertyId: string) {
  const existing = await db.wishlist.findUnique({ where: { userId_propertyId: { userId, propertyId } } });
  if (existing) {
    await db.wishlist.delete({ where: { userId_propertyId: { userId, propertyId } } });
    return { saved: false };
  }
  await db.wishlist.create({ data: { userId, propertyId } });
  return { saved: true };
}
