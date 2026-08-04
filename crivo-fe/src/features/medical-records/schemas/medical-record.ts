import { z } from "zod";

/**
 * Espelha `UpsertAnamnesisDto` do crivo-be: todos opcionais, porque a ficha
 * é preenchida aos poucos — exigir tudo de uma vez faria inventar dado só
 * para conseguir salvar.
 */
export const anamnesisFormSchema = z.object({
  allergies: z.string().trim().max(2000).optional().or(z.literal("")),
  medications: z.string().trim().max(2000).optional().or(z.literal("")),
  conditions: z.string().trim().max(2000).optional().or(z.literal("")),
  observations: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type AnamnesisFormSchema = z.infer<typeof anamnesisFormSchema>;

export const clinicalNoteFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Escreva ao menos 3 caracteres")
    .max(10000, "Texto muito longo"),
});

export type ClinicalNoteFormSchema = z.infer<typeof clinicalNoteFormSchema>;
