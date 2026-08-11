import { api } from "@/config/api";
import type { RegisterSchema } from "../schemas/register";

export type RegisterResponse = {
  tenant: { id: string; name: string; subdomain: string };
  user: { id: string; name: string; email: string };
};

/** Endpoint público: cria tenant + usuário ADMIN, mas não devolve token. */
export async function register(
  input: RegisterSchema,
): Promise<RegisterResponse> {
  return api.post("auth/register", { json: input }).json<RegisterResponse>();
}
