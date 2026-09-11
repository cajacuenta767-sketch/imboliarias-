import { created, handler, parseBody } from "@/server/http";
import { register, registerSchema } from "@/server/modules/users/service";

export const POST = handler(async (req) => {
  const input = await parseBody(req, registerSchema);
  const user = await register(input);
  return created({ id: user.id, email: user.email, name: user.name, role: user.role });
});
