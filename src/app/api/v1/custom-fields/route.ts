import { collectionRoute } from "@/server/lib/crud-route";
import { createCustomField, customFieldSchema, listCustomFields } from "@/server/modules/customFields/service";

export const { GET, POST } = collectionRoute({ list: () => listCustomFields(), create: createCustomField, schema: customFieldSchema, publicList: true });
