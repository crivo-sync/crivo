import { api, authHeaders } from "@/config/api";
import type { AnamnesisFormSchema } from "../schemas/medical-record";
import type { Anamnesis } from "../types";

export async function putAnamnesis(
  patientId: string,
  input: AnamnesisFormSchema,
  accessToken: string,
): Promise<Anamnesis> {
  return api
    .put(`patients/${patientId}/anamnesis`, {
      json: input,
      headers: authHeaders(accessToken),
    })
    .json<Anamnesis>();
}
