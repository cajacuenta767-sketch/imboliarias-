import { handler, ok } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { badRequest } from "@/server/errors";
import { parseCsv } from "@/server/lib/csv";
import { importProperties } from "@/server/modules/properties/service";

export const POST = handler(async (req) => {
  const user = await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("Adjunta un archivo CSV");
  const rows = parseCsv(await file.text());
  return ok(await importProperties(rows, user));
});
