import { api, authHeaders } from "@/config/api";
import type { PaginatedResponse, Patient } from "../types";
import type { PatientsQueryParams } from "../schemas/patients-query-params";

export async function getPatients(
  params: PatientsQueryParams,
  accessToken: string,
): Promise<PaginatedResponse<Patient>> {
  return api
    .get("patients", {
      headers: authHeaders(accessToken),
      searchParams: {
        page: params.page,
        perPage: params.perPage,
        ...(params.search ? { search: params.search } : {}),
      },
    })
    .json<PaginatedResponse<Patient>>();
}
