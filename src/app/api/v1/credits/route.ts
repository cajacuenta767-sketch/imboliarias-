import { handler, ok } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { creditHistory } from "@/server/modules/billing/service";
import { db } from "@/server/db";

export const GET = handler(async () => {
  const user = await requireUser();
  const u = await db.user.findUnique({ where: { id: user.id }, select: { credits: true } });
  return ok({ credits: u?.credits ?? 0, history: await creditHistory(user.id) });
});
