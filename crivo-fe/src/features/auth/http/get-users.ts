import { api, authHeaders } from "@/config/api";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  isActive: boolean;
};

/**
 * `GET /users` é ADMIN-only no crivo-be — usado aqui só logo após o login
 * bem-sucedido, para descobrir o nome de exibição do próprio usuário (não
 * existe endpoint "quem sou eu" ainda; ver docs/ROADMAP.md). Falha para
 * STAFF, e quem chama cai no fallback do e-mail digitado.
 */
export async function getUsers(accessToken: string): Promise<UserSummary[]> {
  return api
    .get("users", { headers: authHeaders(accessToken) })
    .json<UserSummary[]>();
}
