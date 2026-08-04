import { z } from "zod";

import { HEX_COLOR_RE } from "../hex-color";

const MINUTES_IN_DAY = 24 * 60;

// `logoUrl` não entra aqui de propósito: o logo é enviado por upload
// (`LogoUpload`), que salva sozinho na hora — não faz parte deste formulário.

// Espelha UpdateTenantDto do crivo-be.
export const updateTenantSchema = z
  .object({
    name: z.string().trim().min(2, "Informe ao menos 2 caracteres").optional(),
    primaryColor: z
      .string()
      .regex(HEX_COLOR_RE, "Cor inválida (ex: #4F46E5)")
      .optional()
      .or(z.literal("")),
    secondaryColor: z
      .string()
      .regex(HEX_COLOR_RE, "Cor inválida (ex: #22D3EE)")
      .optional()
      .or(z.literal("")),
    phone: z.string().trim().optional().or(z.literal("")),
    email: z.email("E-mail inválido").optional().or(z.literal("")),
    address: z.string().trim().optional().or(z.literal("")),
    aiMessagesEnabled: z.boolean().optional(),
    // Minutos desde a meia-noite (480 = 08:00). O TimePicker converte na borda
    // do formulário; aqui só chegam inteiros já validados.
    businessHoursStart: z
      .number()
      .int("Horário inválido")
      .min(0, "Horário inválido")
      .max(MINUTES_IN_DAY - 1, "Horário inválido")
      .optional(),
    businessHoursEnd: z
      .number()
      .int("Horário inválido")
      .min(0, "Horário inválido")
      .max(MINUTES_IN_DAY - 1, "Horário inválido")
      .optional(),
    // Convenção `Date.getDay()`: 0 = domingo … 6 = sábado.
    businessDays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Selecione ao menos um dia de funcionamento")
      .optional(),
  })
  // Espelha a validação do backend ("O horário de abertura precisa ser
  // anterior ao de fechamento.") só para dar feedback inline — a fonte da
  // verdade continua sendo a API.
  .superRefine((values, ctx) => {
    const { businessHoursStart, businessHoursEnd } = values;
    if (businessHoursStart == null || businessHoursEnd == null) return;
    if (businessHoursStart < businessHoursEnd) return;

    ctx.addIssue({
      code: "custom",
      path: ["businessHoursEnd"],
      message: "O horário de fechamento precisa ser posterior ao de abertura.",
    });
  });

export type UpdateTenantSchema = z.infer<typeof updateTenantSchema>;
