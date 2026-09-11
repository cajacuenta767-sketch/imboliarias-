import { collectionRoute } from "@/server/lib/crud-route";
import { createState, listStates, stateSchema } from "@/server/modules/locations/service";

export const { GET, POST } = collectionRoute({
  list: (req) => listStates(new URL(req.url).searchParams.get("countryId") ?? undefined),
  create: createState,
  schema: stateSchema,
  publicList: true,
});
