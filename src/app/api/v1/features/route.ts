import { collectionRoute } from "@/server/lib/crud-route";
import { createFeature, featureSchema, listFeatures } from "@/server/modules/features/service";

export const { GET, POST } = collectionRoute({ list: () => listFeatures(), create: createFeature, schema: featureSchema, publicList: true });
