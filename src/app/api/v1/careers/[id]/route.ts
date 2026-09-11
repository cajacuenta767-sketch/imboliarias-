import { itemRoute } from "@/server/lib/crud-route";
import { careerSchema, deleteCareer, getCareerById, updateCareer } from "@/server/modules/careers/service";

export const { GET, PUT, DELETE } = itemRoute({ get: getCareerById, update: updateCareer, remove: deleteCareer, schema: careerSchema });
