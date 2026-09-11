import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { HttpError } from "./errors";

export type Meta = { page: number; perPage: number; total: number; totalPages: number };

export function ok<T>(data: T, meta?: Meta, init?: ResponseInit) {
  return NextResponse.json(meta ? { data, meta } : { data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, details: error.details ?? null }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos", details: error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}

/** Envuelve un handler para capturar errores y devolver respuestas uniformes. */
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return fail(e);
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const json = await req.json().catch(() => ({}));
  return schema.parse(json);
}

export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  const url = new URL(req.url);
  const obj: Record<string, string | string[]> = {};
  url.searchParams.forEach((v, k) => {
    if (k in obj) {
      const cur = obj[k];
      obj[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
    } else obj[k] = v;
  });
  return schema.parse(obj);
}

export async function routeParams<T extends Record<string, string>>(ctx: { params: Promise<T> | T }) {
  return await ctx.params;
}
