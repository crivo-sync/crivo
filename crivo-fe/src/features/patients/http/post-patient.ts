import { api, authHeaders } from "@/config/api";
import type { Patient } from "../types";
import type { CreatePatientSchema } from "../schemas/patient";

export async function postPatient(
  input: CreatePatientSchema,
  accessToken: string,
): Promise<Patient> {
  return api
    .post("patients", { json: input, headers: authHeaders(accessToken) })
    .json<Patient>();
}
