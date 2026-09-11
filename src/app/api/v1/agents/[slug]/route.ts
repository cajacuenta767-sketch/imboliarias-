import { handler, ok, routeParams } from "@/server/http";
import { getAgentBySlug } from "@/server/modules/agents/service";

export const GET = handler(async (_req, ctx: { params: Promise<{ slug: string }> }) => ok(await getAgentBySlug((await routeParams(ctx)).slug)));
