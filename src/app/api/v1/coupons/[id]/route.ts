import { itemRoute } from "@/server/lib/crud-route";
import { couponSchema, deleteCoupon, updateCoupon } from "@/server/modules/billing/service";

export const { PUT, DELETE } = itemRoute({ update: updateCoupon, remove: deleteCoupon, schema: couponSchema.partial() });
