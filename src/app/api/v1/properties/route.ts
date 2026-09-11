import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { currentUser, requireRole } from "@/server/auth/guards";
import { propertyInputSchema, propertyQuerySchema } from "@/server/modules/properties/schema";
import { createProperty, listProperties } from "@/server/modules/properties/service";

export const GET = handler(async (req) => {
  const q = parseQuery(req, propertyQuerySchema);
  const user = await currentUser();
  if (q.scope === "admin" && user?.role !== "ADMIN") q.scope = "public";
  const { items, meta } = await listProperties(q, user);
  return ok(items, meta);
});

export const POST = handler(async (req) => {
  const user = await requireRole("ADMIN", "AGENT", "CUSTOMER");
  const input = await parseBody(req, propertyInputSchema);
  return created(await createProperty(input, user));
});
