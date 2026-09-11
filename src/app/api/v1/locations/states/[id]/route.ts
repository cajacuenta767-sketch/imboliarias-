import { itemRoute } from "@/server/lib/crud-route";
import { deleteState, stateSchema, updateState } from "@/server/modules/locations/service";

export const { PUT, DELETE } = itemRoute({ update: updateState, remove: deleteState, schema: stateSchema.partial() });
