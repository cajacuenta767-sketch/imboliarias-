import { created, handler, parseBody } from "@/server/http";
import { register, registerSchema } from "@/server/modules/users/service";
import { rateLimit } from "@/server/lib/rate-limit";

export const POST = handler(async (req) => {
  rateLimit(req, "register", 10, 60 * 60_000);
  const input = await parseBody(req, registerSchema);
  const user = await register(input);
  return created({ id: user.id, email: user.email, name: user.name, role: user.role });
});
