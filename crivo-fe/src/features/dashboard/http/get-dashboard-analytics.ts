import { api, authHeaders } from "@/config/api";
import type { DashboardAnalytics } from "../types";

export async function getDashboardAnalytics(
  accessToken: string,
  revenueDays?: number,
): Promise<DashboardAnalytics> {
  return api
    .get("dashboard/analytics", {
      headers: authHeaders(accessToken),
      // Sem o parâmetro o backend aplica o próprio default (30 dias).
      ...(revenueDays ? { searchParams: { revenueDays } } : {}),
    })
    .json<DashboardAnalytics>();
}
