import { collectionRoute } from "@/server/lib/crud-route";
import { countrySchema, createCountry, listCountries } from "@/server/modules/locations/service";

export const { GET, POST } = collectionRoute({ list: () => listCountries(), create: createCountry, schema: countrySchema, publicList: true });
