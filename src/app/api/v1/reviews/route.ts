import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { currentUser, requireAdmin } from "@/server/auth/guards";
import { rateLimit } from "@/server/lib/rate-limit";
import { createReview, listReviews, reviewInputSchema, reviewQuerySchema } from "@/server/modules/reviews/service";

export const GET = handler(async (req) => {
  await requireAdmin();
  const { items, meta } = await listReviews(parseQuery(req, reviewQuerySchema));
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  rateLimit(req, "review", 5, 60 * 60_000);
  const user = await currentUser();
  const input = await parseBody(req, reviewInputSchema);
  return created(await createReview(input, user?.id));
});
