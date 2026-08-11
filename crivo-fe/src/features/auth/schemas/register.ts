import { z } from "zod";

const SUBDOMAIN_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED = ["www", "app", "api", "admin", "painel", "crivo", "suporte"];

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  tenantName: z.string().trim().min(2, "Informe o nome da clínica"),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "O endereço precisa ter pelo menos 3 caracteres")
    .max(40, "O endereço pode ter no máximo 40 caracteres")
    .regex(SUBDOMAIN_RE, "Use só letras minúsculas, números e hífen")
    .refine((value) => !RESERVED.includes(value), "Este endereço é reservado"),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

/**
 * Sugestão de subdomínio a partir do nome da clínica, digitada campo a
 * campo — a pessoa pode sempre editar antes de enviar.
 */
export function suggestSubdomain(clinicName: string): string {
  return clinicName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
