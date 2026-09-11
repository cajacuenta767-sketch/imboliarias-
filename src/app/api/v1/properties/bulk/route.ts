import { handler, ok, parseBody } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { bulkActionSchema } from "@/server/modules/properties/schema";
import { bulkAction } from "@/server/modules/properties/service";

export const POST = handler(async (req) => {
  await requireAdmin();
  const { ids, action } = await parseBody(req, bulkActionSchema);
  return ok(await bulkAction(ids, action));
});
