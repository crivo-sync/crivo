import { api, authHeaders } from "@/config/api";
import type { Professional } from "../types";

export async function getProfessional(
  id: string,
  accessToken: string,
): Promise<Professional> {
  return api
    .get(`professionals/${id}`, { headers: authHeaders(accessToken) })
    .json<Professional>();
}
