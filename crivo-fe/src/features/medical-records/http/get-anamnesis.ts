import { api, authHeaders } from "@/config/api";
import type { Anamnesis } from "../types";

/** Devolve `null` quando a ficha nunca foi preenchida — não é erro. */
export async function getAnamnesis(
  patientId: string,
  accessToken: string,
): Promise<Anamnesis | null> {
  return api
    .get(`patients/${patientId}/anamnesis`, {
      headers: authHeaders(accessToken),
    })
    .json<Anamnesis | null>();
}
