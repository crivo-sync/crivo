import { z } from "zod";

// Espelha ProfessionalsQueryDto do crivo-be: page, perPage, search, onlyActive.
export const professionalsQueryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  /**
   * Esconde os desativados. A tela de Profissionais **não** passa (precisa
   * mostrar quem foi desativado, para reativar depois de um upgrade); quem
   * monta agenda passa `true`.
   */
  onlyActive: z.boolean().optional(),
});

export type ProfessionalsQueryParams = z.infer<
  typeof professionalsQueryParamsSchema
>;
