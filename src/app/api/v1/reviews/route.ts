import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { currentUser, requireAdmin } from "@/server/auth/guards";
import { createReview, listReviews, reviewInputSchema, reviewQuerySchema } from "@/server/modules/reviews/service";

export const GET = handler(async (req) => {
  await requireAdmin();
  const { items, meta } = await listReviews(parseQuery(req, reviewQuerySchema));
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  const user = await currentUser();
  const input = await parseBody(req, reviewInputSchema);
  return created(await createReview(input, user?.id));
});
