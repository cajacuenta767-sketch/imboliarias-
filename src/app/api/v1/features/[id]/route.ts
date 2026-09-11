import { itemRoute } from "@/server/lib/crud-route";
import { deleteFeature, featureSchema, updateFeature } from "@/server/modules/features/service";

export const { PUT, DELETE } = itemRoute({ update: updateFeature, remove: deleteFeature, schema: featureSchema.partial() });
