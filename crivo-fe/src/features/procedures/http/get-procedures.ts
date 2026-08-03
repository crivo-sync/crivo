import { api, authHeaders } from "@/config/api";
import type { PaginatedResponse, Procedure } from "../types";
import type { ProceduresQueryParams } from "../schemas/procedures-query-params";

export async function getProcedures(
  params: ProceduresQueryParams,
  accessToken: string,
): Promise<PaginatedResponse<Procedure>> {
  return api
    .get("procedures", {
      headers: authHeaders(accessToken),
      searchParams: {
        page: params.page,
        perPage: params.perPage,
        ...(params.search ? { search: params.search } : {}),
      },
    })
    .json<PaginatedResponse<Procedure>>();
}
