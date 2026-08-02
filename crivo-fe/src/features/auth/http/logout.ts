import { api } from "@/config/api";

/**
 * Revoga o refresh token no backend. Endpoint público: identifica a sessão
 * pelo próprio refresh token no corpo, não pelo Bearer.
 */
export async function logout(refreshToken: string): Promise<void> {
  await api.post("auth/logout", { json: { refreshToken } });
}
