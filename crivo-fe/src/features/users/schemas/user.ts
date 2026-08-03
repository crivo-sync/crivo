import { z } from "zod";

// Espelha CreateUserDto do crivo-be.
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

// Espelha UpdateUserDto do crivo-be: tudo opcional, sem password (não existe
// endpoint de troca de senha por terceiros — ver docs/ROADMAP.md).
export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres").optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

/**
 * Schema único do formulário — cadastro e edição usam os mesmos campos na
 * tela, mas `email`/`password` só existem em `CreateUserDto`: o backend não
 * aceita trocar e-mail nem senha de terceiro via `PATCH /users/:id`. Em vez
 * de bifurcar o resolver do react-hook-form (frágil: o tipo inferido do
 * form nunca bate exatamente com o schema trocado em runtime), um único
 * schema com esses dois campos opcionais e `superRefine` cobrando-os só
 * quando `isEditing` é `false` — o componente decide o modo, não o schema.
 */
export const userFormSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres"),
  email: z.email("E-mail inválido").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "STAFF"]),
});

export type UserFormSchema = z.infer<typeof userFormSchema>;
