import { z } from "zod";

// Espelha CreateProcedureDto do crivo-be: name, durationMinutes e
// priceInCents são obrigatórios; description é opcional.
export const createProcedureSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres"),
  description: z.string().trim().optional().or(z.literal("")),
  durationMinutes: z
    .number()
    .int()
    .min(5, "Duração mínima de 5 minutos")
    .max(480, "Duração máxima de 480 minutos"),
  priceInCents: z.number().int().min(0, "Preço não pode ser negativo"),
});

export type CreateProcedureSchema = z.infer<typeof createProcedureSchema>;

/**
 * UpdateProcedureDto no backend é PartialType(CreateProcedureDto) +
 * `isActive` — o único campo que existe na atualização e não no cadastro.
 */
export const updateProcedureSchema = createProcedureSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateProcedureSchema = z.infer<typeof updateProcedureSchema>;

/**
 * Schema do formulário — um só para cadastro e edição. `isActive` sempre
 * existe no form (o Switch só é renderizado na edição), mas a action de
 * cadastro descarta o campo, já que `CreateProcedureDto` não o aceita.
 */
export const procedureFormSchema = createProcedureSchema.extend({
  isActive: z.boolean(),
});

export type ProcedureFormSchema = z.infer<typeof procedureFormSchema>;
