import { itemRoute } from "@/server/lib/crud-route";
import { deleteFacility, facilitySchema, updateFacility } from "@/server/modules/facilities/service";

export const { PUT, DELETE } = itemRoute({ update: updateFacility, remove: deleteFacility, schema: facilitySchema.partial() });
