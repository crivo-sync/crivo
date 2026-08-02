import { api, authHeaders } from "@/config/api";

export async function deletePatient(
  id: string,
  accessToken: string,
): Promise<void> {
  await api.delete(`patients/${id}`, { headers: authHeaders(accessToken) });
}
