"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { getDashboardAnalytics } from "../http/get-dashboard-analytics";
import type { ActionResult, DashboardAnalytics } from "../types";

export async function getDashboardAnalyticsAction(): Promise<
  ActionResult<DashboardAnalytics>
> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const data = await getDashboardAnalytics(session.accessToken);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Dashboard Analytics Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
