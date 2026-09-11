import { collectionRoute } from "@/server/lib/crud-route";
import { currentUser, isAdmin } from "@/server/auth/guards";
import { citySchema, createCity, listCities } from "@/server/modules/locations/service";

export const { GET, POST } = collectionRoute({
  // El administrador ve también las ciudades inactivas para poder reactivarlas.
  list: async (req) => listCities(new URL(req.url).searchParams.get("stateId") ?? undefined, !isAdmin(await currentUser())),
  create: createCity,
  schema: citySchema,
  publicList: true,
});
