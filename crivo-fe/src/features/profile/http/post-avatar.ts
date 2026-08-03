import { api, authHeaders } from "@/config/api";
import type { Profile } from "../types";

export async function postAvatar(
  file: File,
  accessToken: string,
): Promise<Profile> {
  const formData = new FormData();
  formData.append("file", file);

  // Sem Content-Type manual: o browser define
  // "multipart/form-data; boundary=..." sozinho a partir do FormData.
  return api
    .post("users/me/avatar", { body: formData, headers: authHeaders(accessToken) })
    .json<Profile>();
}
