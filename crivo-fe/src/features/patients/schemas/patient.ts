import { z } from "zod";

// Espelha CreatePatientDto do crivo-be: name, phone obrigatórios; cpf, email opcionais.
export const createPatientSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos (com DDD)"),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "CPF deve ter exatamente 11 dígitos")
    .optional()
    .or(z.literal("")),
  email: z.email("E-mail inválido").optional().or(z.literal("")),
});

export type CreatePatientSchema = z.infer<typeof createPatientSchema>;

// UpdatePatientDto no backend é PartialType(CreatePatientDto) — todos opcionais.
export const updatePatientSchema = createPatientSchema.partial();

export type UpdatePatientSchema = z.infer<typeof updatePatientSchema>;
