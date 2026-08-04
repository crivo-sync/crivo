"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getDashboardAnalytics } from "../http/get-dashboard-analytics";
import type { ActionResult, DashboardAnalytics } from "../types";

export async function getDashboardAnalyticsAction(
  revenueDays?: number,
): Promise<ActionResult<DashboardAnalytics>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getDashboardAnalytics(token, revenueDays),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Dashboard Analytics Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
