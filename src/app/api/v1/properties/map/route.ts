import { handler, ok, parseQuery } from "@/server/http";
import { propertyQuerySchema } from "@/server/modules/properties/schema";
import { mapPoints } from "@/server/modules/properties/service";

export const GET = handler(async (req) => ok(await mapPoints(parseQuery(req, propertyQuerySchema))));
