import { api, authHeaders } from "@/config/api";
import type { Procedure } from "../types";

export async function getProcedure(
  id: string,
  accessToken: string,
): Promise<Procedure> {
  return api
    .get(`procedures/${id}`, { headers: authHeaders(accessToken) })
    .json<Procedure>();
}
