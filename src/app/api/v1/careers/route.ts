import { collectionRoute } from "@/server/lib/crud-route";
import { currentUser, isAdmin } from "@/server/auth/guards";
import { careerSchema, createCareer, listCareers } from "@/server/modules/careers/service";

export const { GET, POST } = collectionRoute({
  // Solo el administrador ve vacantes cerradas (y el conteo de postulaciones).
  list: async (req) => listCareers(new URL(req.url).searchParams.get("open") === "1" || !isAdmin(await currentUser())),
  create: createCareer,
  schema: careerSchema,
  publicList: true,
});
