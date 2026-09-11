import { collectionRoute } from "@/server/lib/crud-route";
import { createPostCategory, listPostCategories, postCategorySchema } from "@/server/modules/posts/service";

export const { GET, POST } = collectionRoute({ list: () => listPostCategories(), create: createPostCategory, schema: postCategorySchema, publicList: true });
