import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(12),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function paginate({ page, perPage }: Pagination) {
  return { skip: (page - 1) * perPage, take: perPage };
}

export function meta({ page, perPage }: Pagination, total: number) {
  return { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
