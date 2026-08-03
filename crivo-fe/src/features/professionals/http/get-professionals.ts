import { api, authHeaders } from "@/config/api";
import type { PaginatedResponse, Professional } from "../types";
import type { ProfessionalsQueryParams } from "../schemas/professionals-query-params";

export async function getProfessionals(
  params: ProfessionalsQueryParams,
  accessToken: string,
): Promise<PaginatedResponse<Professional>> {
  return api
    .get("professionals", {
      headers: authHeaders(accessToken),
      searchParams: {
        page: params.page,
        perPage: params.perPage,
        ...(params.search ? { search: params.search } : {}),
      },
    })
    .json<PaginatedResponse<Professional>>();
}
