import { itemRoute } from "@/server/lib/crud-route";
import { citySchema, deleteCity, updateCity } from "@/server/modules/locations/service";

export const { PUT, DELETE } = itemRoute({ update: updateCity, remove: deleteCity, schema: citySchema.partial() });
