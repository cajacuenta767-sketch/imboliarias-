import { itemRoute } from "@/server/lib/crud-route";
import { couponPatchSchema, deleteCoupon, updateCoupon } from "@/server/modules/billing/service";

export const { PUT, DELETE } = itemRoute({ update: updateCoupon, remove: deleteCoupon, schema: couponPatchSchema });
