import { collectionRoute } from "@/server/lib/crud-route";
import { createPage, listPages, pageSchema } from "@/server/modules/pages/service";

export const { GET, POST } = collectionRoute({ list: () => listPages(), create: createPage, schema: pageSchema });
