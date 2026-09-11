import { handler, ok } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { adminStats } from "@/server/modules/dashboard/service";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await adminStats());
});
