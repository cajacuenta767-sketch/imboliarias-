import { itemRoute } from "@/server/lib/crud-route";
import { deletePost, getPostById, postSchema, updatePost } from "@/server/modules/posts/service";

export const { GET, PUT, DELETE } = itemRoute({ get: getPostById, update: updatePost, remove: deletePost, schema: postSchema });
