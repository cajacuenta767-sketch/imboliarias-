import { itemRoute } from "@/server/lib/crud-route";
import { customFieldSchema, deleteCustomField, updateCustomField } from "@/server/modules/customFields/service";

export const { PUT, DELETE } = itemRoute({ update: updateCustomField, remove: deleteCustomField, schema: customFieldSchema });
