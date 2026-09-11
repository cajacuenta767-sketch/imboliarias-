import { itemRoute } from "@/server/lib/crud-route";
import { deletePage, pageSchema, updatePage } from "@/server/modules/pages/service";

export const { PUT, DELETE } = itemRoute({ update: updatePage, remove: deletePage, schema: pageSchema });
