import { collectionRoute } from "@/server/lib/crud-route";
import { careerSchema, createCareer, listCareers } from "@/server/modules/careers/service";

export const { GET, POST } = collectionRoute({ list: (req) => listCareers(new URL(req.url).searchParams.get("open") === "1"), create: createCareer, schema: careerSchema, publicList: true });
