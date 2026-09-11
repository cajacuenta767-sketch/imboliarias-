import { itemRoute } from "@/server/lib/crud-route";
import { deleteProject, getProjectById, projectInputSchema, updateProject } from "@/server/modules/projects/service";

export const { GET, PUT, DELETE } = itemRoute({ get: getProjectById, update: updateProject, remove: deleteProject, schema: projectInputSchema });
