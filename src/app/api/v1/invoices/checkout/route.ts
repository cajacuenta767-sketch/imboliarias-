import { created, handler, parseBody } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { checkout, checkoutSchema } from "@/server/modules/billing/service";

export const POST = handler(async (req) => {
  const user = await requireUser();
  return created(await checkout(await parseBody(req, checkoutSchema), user));
});
