import { collectionRoute } from "@/server/lib/crud-route";
import { citySchema, createCity, listCities } from "@/server/modules/locations/service";

export const { GET, POST } = collectionRoute({
  list: (req) => listCities(new URL(req.url).searchParams.get("stateId") ?? undefined),
  create: createCity,
  schema: citySchema,
  publicList: true,
});
