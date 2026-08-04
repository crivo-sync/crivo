import { api, authHeaders } from "@/config/api";
import type { ClinicalNoteFormSchema } from "../schemas/medical-record";
import type { ClinicalNote } from "../types";

export async function postClinicalNote(
  patientId: string,
  input: ClinicalNoteFormSchema,
  accessToken: string,
): Promise<ClinicalNote> {
  return api
    .post(`patients/${patientId}/clinical-notes`, {
      json: input,
      headers: authHeaders(accessToken),
    })
    .json<ClinicalNote>();
}
