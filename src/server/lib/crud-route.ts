import type { ZodType } from "zod";
import { created, handler, ok, parseBody, routeParams } from "@/server/http";
import { requireAdmin } from "@/server/auth/guards";

type ListFn = (req: Request) => Promise<unknown>;

/** Fábrica de rutas GET/POST para colecciones simples de administración. */
export function collectionRoute<TIn>(opts: {
  list: ListFn;
  create: (input: TIn) => Promise<unknown>;
  schema: ZodType<TIn>;
  publicList?: boolean;
}) {
  const GET = handler(async (req: Request) => {
    if (!opts.publicList) await requireAdmin();
    return ok(await opts.list(req));
  });
  const POST = handler(async (req: Request) => {
    await requireAdmin();
    const input = await parseBody(req, opts.schema);
    return created(await opts.create(input));
  });
  return { GET, POST };
}

/** Fábrica de rutas PUT/PATCH/DELETE para elementos simples de administración. */
export function itemRoute<TIn>(opts: {
  update: (id: string, input: TIn) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  schema: ZodType<TIn>;
  get?: (id: string) => Promise<unknown>;
}) {
  type Ctx = { params: Promise<{ id: string }> };
  const GET = handler(async (_req: Request, ctx: Ctx) => {
    await requireAdmin();
    const { id } = await routeParams(ctx);
    if (!opts.get) return ok(null);
    return ok(await opts.get(id));
  });
  const PUT = handler(async (req: Request, ctx: Ctx) => {
    await requireAdmin();
    const { id } = await routeParams(ctx);
    const input = await parseBody(req, opts.schema);
    return ok(await opts.update(id, input));
  });
  const DELETE = handler(async (_req: Request, ctx: Ctx) => {
    await requireAdmin();
    const { id } = await routeParams(ctx);
    await opts.remove(id);
    return ok({ deleted: true });
  });
  return { GET, PUT, PATCH: PUT, DELETE };
}
