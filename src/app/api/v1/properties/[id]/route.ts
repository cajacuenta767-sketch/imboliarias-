import { handler, ok, parseBody, routeParams } from "@/server/http";
import { currentUser, requireUser } from "@/server/auth/guards";
import { forbidden } from "@/server/errors";
import { propertyInputSchema } from "@/server/modules/properties/schema";
import { deleteProperty, getPropertyById, updateProperty } from "@/server/modules/properties/service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req, ctx: Ctx) => {
  const { id } = await routeParams(ctx);
  const p = await getPropertyById(id);
  const user = await currentUser();
  const owner = user && (user.role === "ADMIN" || user.id === p.authorId);
  if (!owner && p.moderation !== "APPROVED") throw forbidden();
  return ok(p);
});

export const PUT = handler(async (req, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await routeParams(ctx);
  const input = await parseBody(req, propertyInputSchema);
  return ok(await updateProperty(id, input, user));
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  const user = await requireUser();
  const { id } = await routeParams(ctx);
  await deleteProperty(id, user);
  return ok({ deleted: true });
});
