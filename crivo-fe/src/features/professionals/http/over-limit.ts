import { api, authHeaders } from "@/config/api";
import type { OverLimitStatus } from "../types";

export async function getOverLimitStatus(
  accessToken: string,
): Promise<OverLimitStatus> {
  return api
    .get("professionals/over-limit", { headers: authHeaders(accessToken) })
    .json<OverLimitStatus>();
}

export async function resolveOverLimit(
  keepProfessionalIds: string[],
  accessToken: string,
): Promise<{ deactivated: number }> {
  return api
    .post("professionals/over-limit/resolve", {
      headers: authHeaders(accessToken),
      json: { keepProfessionalIds },
    })
    .json<{ deactivated: number }>();
}
