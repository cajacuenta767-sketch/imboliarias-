import { handler, ok, parseBody } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { getUser, profileSchema, updateProfile } from "@/server/modules/users/service";

export const GET = handler(async () => {
  const user = await requireUser();
  const u = await getUser(user.id);
  const { passwordHash, ...safe } = u;
  void passwordHash;
  return ok(safe);
});
export const PUT = handler(async (req) => {
  const user = await requireUser();
  const u = await updateProfile(user.id, await parseBody(req, profileSchema));
  const { passwordHash, ...safe } = u;
  void passwordHash;
  return ok(safe);
});
