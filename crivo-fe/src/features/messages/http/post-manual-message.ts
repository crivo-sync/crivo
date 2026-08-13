import { api, authHeaders } from "@/config/api";

export async function postManualMessage(
  patientId: string,
  body: string,
  accessToken: string,
): Promise<void> {
  // 204 sem corpo — não há `.json()` aqui, que lançaria em resposta vazia.
  await api.post(`messages/conversation/${patientId}`, {
    headers: authHeaders(accessToken),
    json: { body },
  });
}
