import { api, authHeaders } from "@/config/api";
import type { ClinicalNote, PaginatedResponse } from "../types";

export async function getClinicalNotes(
  patientId: string,
  params: { page: number; perPage: number },
  accessToken: string,
): Promise<PaginatedResponse<ClinicalNote>> {
  return api
    .get(`patients/${patientId}/clinical-notes`, {
      searchParams: { page: params.page, perPage: params.perPage },
      headers: authHeaders(accessToken),
    })
    .json<PaginatedResponse<ClinicalNote>>();
}
