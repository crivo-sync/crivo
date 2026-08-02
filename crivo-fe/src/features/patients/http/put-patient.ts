import { api, authHeaders } from "@/config/api";
import type { Patient } from "../types";
import type { UpdatePatientSchema } from "../schemas/patient";

export async function putPatient(
  id: string,
  input: UpdatePatientSchema,
  accessToken: string,
): Promise<Patient> {
  return api
    .patch(`patients/${id}`, { json: input, headers: authHeaders(accessToken) })
    .json<Patient>();
}
