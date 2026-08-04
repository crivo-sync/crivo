import { api, authHeaders } from "@/config/api";
import type { Tenant } from "../types";

export async function uploadLogo(
  file: File,
  accessToken: string,
): Promise<Tenant> {
  const formData = new FormData();
  formData.append("file", file);

  // Sem Content-Type manual: o browser define
  // "multipart/form-data; boundary=..." sozinho a partir do FormData.
  return api
    .post("tenants/me/logo", {
      body: formData,
      headers: authHeaders(accessToken),
    })
    .json<Tenant>();
}
