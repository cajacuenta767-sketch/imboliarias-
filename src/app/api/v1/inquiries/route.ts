import { created, handler, ok, parseBody, parseQuery } from "@/server/http";
import { requireUser } from "@/server/auth/guards";
import { createInquiry, inquiryInputSchema, inquiryQuerySchema, listInquiries } from "@/server/modules/inquiries/service";

export const GET = handler(async (req) => {
  const user = await requireUser();
  const { items, meta } = await listInquiries(parseQuery(req, inquiryQuerySchema), user);
  return ok(items, meta);
});
export const POST = handler(async (req) => created(await createInquiry(await parseBody(req, inquiryInputSchema))));
