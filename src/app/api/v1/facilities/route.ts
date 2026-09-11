import { collectionRoute } from "@/server/lib/crud-route";
import { createFacility, facilitySchema, listFacilities } from "@/server/modules/facilities/service";

export const { GET, POST } = collectionRoute({ list: () => listFacilities(), create: createFacility, schema: facilitySchema, publicList: true });
