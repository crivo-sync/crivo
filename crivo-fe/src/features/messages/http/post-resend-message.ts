import { api, authHeaders } from "@/config/api";

export async function postResendMessage(
  id: string,
  accessToken: string,
): Promise<void> {
  // 204 sem corpo — não há `.json()` aqui, que lançaria em resposta vazia.
  await api.post(`messages/${id}/resend`, {
    headers: authHeaders(accessToken),
  });
}
