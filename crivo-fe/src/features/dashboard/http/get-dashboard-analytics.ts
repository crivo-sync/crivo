import { api, authHeaders } from "@/config/api";
import type { DashboardAnalytics } from "../types";

export async function getDashboardAnalytics(
  accessToken: string,
): Promise<DashboardAnalytics> {
  return api
    .get("dashboard/analytics", { headers: authHeaders(accessToken) })
    .json<DashboardAnalytics>();
}
