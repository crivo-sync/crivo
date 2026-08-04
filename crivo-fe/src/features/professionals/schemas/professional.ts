import { z } from "zod";

// Espelha CreateProfessionalDto do crivo-be: só `name` é obrigatório.
export const createProfessionalSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres"),
  specialty: z.string().trim().optional().or(z.literal("")),
  councilCode: z.string().trim().optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos (com DDD)")
    .optional()
    .or(z.literal("")),
  email: z.email("E-mail inválido").optional().or(z.literal("")),
  procedureIds: z.array(z.string()),
});

export type CreateProfessionalSchema = z.infer<typeof createProfessionalSchema>;

/**
 * UpdateProfessionalDto no backend é PartialType(CreateProfessionalDto) +
 * `isActive` — o único campo que existe na atualização e não no cadastro.
 */
export const updateProfessionalSchema = createProfessionalSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type UpdateProfessionalSchema = z.infer<typeof updateProfessionalSchema>;

/**
 * Schema do formulário — um só para cadastro e edição. `isActive` sempre
 * existe no form (o Switch só é renderizado na edição), mas a action de
 * cadastro descarta o campo, já que `CreateProfessionalDto` não o aceita.
 */
export const professionalFormSchema = createProfessionalSchema.extend({
  isActive: z.boolean(),
});

export type ProfessionalFormSchema = z.infer<typeof professionalFormSchema>;
