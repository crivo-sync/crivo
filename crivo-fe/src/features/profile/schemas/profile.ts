import { z } from "zod";

// Espelha UpdateMeDto do crivo-be.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres"),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

// Espelha ChangePasswordDto do crivo-be.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z
      .string()
      .min(8, "A nova senha precisa ter ao menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
