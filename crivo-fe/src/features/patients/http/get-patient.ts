import { api, authHeaders } from "@/config/api";
import type { Patient } from "../types";

export async function getPatient(
  id: string,
  accessToken: string,
): Promise<Patient> {
  return api
    .get(`patients/${id}`, { headers: authHeaders(accessToken) })
    .json<Patient>();
}
