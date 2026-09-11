import { handler, ok } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { accountStats } from "@/server/modules/dashboard/service";

export const GET = handler(async () => ok(await accountStats((await requireUser()).id)));
