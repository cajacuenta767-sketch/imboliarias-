import { itemRoute } from "@/server/lib/crud-route";
import { categorySchema, deleteCategory, updateCategory } from "@/server/modules/categories/service";

export const { PUT, DELETE } = itemRoute({ update: updateCategory, remove: deleteCategory, schema: categorySchema.partial() });
