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
  /** Só dígitos: a máscara é da UI, o backend valida `^\d{10,11}$`. */
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Informe um WhatsApp válido com DDD"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  /**
   * Plano escolhido na tabela de preços (`?plano=ESSENCIAL`). **Não cobra
   * nada**: o teste continua 14 dias sem cartão, e o plano só faz o limite
   * dele valer já durante o teste — assim a clínica não monta uma equipe
   * que não caberia no plano que vai assinar.
   *
   * Não vem de campo do formulário e não é validado contra o catálogo aqui:
   * o backend ignora chave desconhecida em vez de recusar o cadastro (perder
   * conta nova por causa de uma URL torta seria o pior desfecho).
   */
  planKey: z.string().trim().optional(),
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
