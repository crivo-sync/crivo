import { api, authHeaders } from "@/config/api";
import type { ImportResult } from "../types";

export async function postPatientsImport(
  file: File,
  dryRun: boolean,
  accessToken: string,
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("dryRun", String(dryRun));

  // Sem Content-Type manual: o browser define
  // "multipart/form-data; boundary=..." sozinho a partir do FormData.
  return api
    .post("patients/import", {
      body: formData,
      headers: authHeaders(accessToken),
    })
    .json<ImportResult>();
}
