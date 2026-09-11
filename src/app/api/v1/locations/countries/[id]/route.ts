import { itemRoute } from "@/server/lib/crud-route";
import { countrySchema, deleteCountry, updateCountry } from "@/server/modules/locations/service";

export const { PUT, DELETE } = itemRoute({ update: updateCountry, remove: deleteCountry, schema: countrySchema.partial() });
