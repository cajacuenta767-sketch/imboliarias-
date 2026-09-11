import { handler, ok, parseBody } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { getUser, profileSchema, updateProfile } from "@/server/modules/users/service";

export const GET = handler(async () => {
  const user = await requireUser();
  return ok(await getUser(user.id));
});
export const PUT = handler(async (req) => {
  const user = await requireUser();
  return ok(await updateProfile(user.id, await parseBody(req, profileSchema)));
});
