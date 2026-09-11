import { collectionRoute } from "@/server/lib/crud-route";
import { couponSchema, createCoupon, listCoupons } from "@/server/modules/billing/service";

export const { GET, POST } = collectionRoute({ list: () => listCoupons(), create: createCoupon, schema: couponSchema });
