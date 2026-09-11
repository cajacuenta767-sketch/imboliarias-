import { handler, parseQuery } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";
import { propertyQuerySchema } from "@/server/modules/properties/schema";
import { exportProperties } from "@/server/modules/properties/service";
import { toCsv } from "@/server/lib/csv";

export const GET = handler(async (req) => {
  await requireAdmin();
  const rows = await exportProperties(parseQuery(req, propertyQuerySchema));
  return new Response(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="propiedades-${Date.now()}.csv"` },
  });
});
