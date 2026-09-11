import { z } from "zod";
import { handler, ok, parseBody } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { listWishlist, toggleWishlist, wishlistIds } from "@/server/modules/wishlist/service";

export const GET = handler(async (req) => {
  const user = await requireUser();
  const idsOnly = new URL(req.url).searchParams.get("ids") === "1";
  return ok(idsOnly ? await wishlistIds(user.id) : await listWishlist(user.id));
});
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { propertyId } = await parseBody(req, z.object({ propertyId: z.string() }));
  return ok(await toggleWishlist(user.id, propertyId));
});
