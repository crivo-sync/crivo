import { api, authHeaders } from "@/config/api";
import type { DashboardSummary } from "../types";

export async function getDashboardSummary(
  accessToken: string,
): Promise<DashboardSummary> {
  return api
    .get("dashboard/summary", { headers: authHeaders(accessToken) })
    .json<DashboardSummary>();
}
