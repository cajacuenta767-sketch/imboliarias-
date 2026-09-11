import { collectionRoute } from "@/server/lib/crud-route";
import { createInvestor, investorSchema, listInvestors } from "@/server/modules/investors/service";

export const { GET, POST } = collectionRoute({ list: () => listInvestors(), create: createInvestor, schema: investorSchema, publicList: true });
