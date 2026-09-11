import { collectionRoute } from "@/server/lib/crud-route";
import { currentUser, isAdmin } from "@/server/auth/guards";
import { createPackage, listPackages, packageSchema } from "@/server/modules/billing/service";

export const { GET, POST } = collectionRoute({
  list: async (req) => listPackages(new URL(req.url).searchParams.get("all") !== "1" || !isAdmin(await currentUser())),
  create: createPackage,
  schema: packageSchema,
  publicList: true,
});
