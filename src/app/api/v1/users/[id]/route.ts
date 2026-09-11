import { itemRoute } from "@/server/lib/crud-route";
import { adminUpdateUser, deleteUser, getUser, userAdminSchema } from "@/server/modules/users/service";

export const { GET, PUT, DELETE } = itemRoute({ get: getUser, update: adminUpdateUser, remove: deleteUser, schema: userAdminSchema.partial() });
