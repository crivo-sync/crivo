import { api, authHeaders } from "@/config/api";

export async function putPassword(
  input: { currentPassword: string; newPassword: string },
  accessToken: string,
): Promise<void> {
  await api.patch("users/me/password", {
    json: input,
    headers: authHeaders(accessToken),
  });
}
