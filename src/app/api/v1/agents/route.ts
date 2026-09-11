import { handler, ok, parseQuery } from "@/server/http";
import { agentQuerySchema, listAgents } from "@/server/modules/agents/service";

export const GET = handler(async (req) => {
  const { items, meta } = await listAgents(parseQuery(req, agentQuerySchema));
  return ok(items, meta);
});
