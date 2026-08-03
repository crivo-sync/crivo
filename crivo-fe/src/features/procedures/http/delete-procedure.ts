import { api, authHeaders } from "@/config/api";

export async function deleteProcedure(
  id: string,
  accessToken: string,
): Promise<void> {
  await api.delete(`procedures/${id}`, {
    headers: authHeaders(accessToken),
  });
}
