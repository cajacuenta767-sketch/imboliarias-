import { collectionRoute } from "@/server/lib/crud-route";
import { createPackage, listPackages, packageSchema } from "@/server/modules/billing/service";

export const { GET, POST } = collectionRoute({ list: (req) => listPackages(new URL(req.url).searchParams.get("all") !== "1"), create: createPackage, schema: packageSchema, publicList: true });
