import { itemRoute } from "@/server/lib/crud-route";
import { deletePackage, packageSchema, updatePackage } from "@/server/modules/billing/service";

export const { PUT, DELETE } = itemRoute({ update: updatePackage, remove: deletePackage, schema: packageSchema.partial() });
