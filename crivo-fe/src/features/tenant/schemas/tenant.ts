import { z } from "zod";

// Espelha UpdateTenantDto do crivo-be.
export const updateTenantSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres").optional(),
  logoUrl: z
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor inválida (ex: #4F46E5)")
    .optional()
    .or(z.literal("")),
  secondaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor inválida (ex: #22D3EE)")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.email("E-mail inválido").optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  aiMessagesEnabled: z.boolean().optional(),
});

export type UpdateTenantSchema = z.infer<typeof updateTenantSchema>;
