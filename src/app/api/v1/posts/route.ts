import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { createPost, listPosts, postQuerySchema, postSchema } from "@/server/modules/posts/service";

export const GET = handler(async (req) => {
  const q = parseQuery(req, postQuerySchema);
  const { items, meta } = await listPosts(q);
  return ok(items, meta);
});
export const POST = handler(async (req) => {
  const user = await requireAdmin();
  return created(await createPost(await parseBody(req, postSchema), user.id));
});
