import { api, authHeaders } from "@/config/api";
import type { UpcomingRiskResponse } from "../types";

export async function getUpcomingRisk(
  params: { days: number; limit: number },
  accessToken: string,
): Promise<UpcomingRiskResponse> {
  return api
    .get("prediction/no-show/upcoming", {
      headers: authHeaders(accessToken),
      searchParams: { days: params.days, limit: params.limit },
    })
    .json<UpcomingRiskResponse>();
}
