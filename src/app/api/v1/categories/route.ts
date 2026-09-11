import { collectionRoute } from "@/server/lib/crud-route";
import { categorySchema, createCategory, listCategories } from "@/server/modules/categories/service";

export const { GET, POST } = collectionRoute({ list: () => listCategories(), create: createCategory, schema: categorySchema, publicList: true });
