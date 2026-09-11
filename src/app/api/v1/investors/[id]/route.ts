import { itemRoute } from "@/server/lib/crud-route";
import { deleteInvestor, investorSchema, updateInvestor } from "@/server/modules/investors/service";

export const { PUT, DELETE } = itemRoute({ update: updateInvestor, remove: deleteInvestor, schema: investorSchema.partial() });
