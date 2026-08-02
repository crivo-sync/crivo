import { z } from "zod";

// Espelha PaginationQueryDto do crivo-be: page, perPage, search.
export const patientsQueryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export type PatientsQueryParams = z.infer<typeof patientsQueryParamsSchema>;
