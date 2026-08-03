import { api, authHeaders } from "@/config/api";

export async function deleteProfessional(
  id: string,
  accessToken: string,
): Promise<void> {
  await api.delete(`professionals/${id}`, {
    headers: authHeaders(accessToken),
  });
}
