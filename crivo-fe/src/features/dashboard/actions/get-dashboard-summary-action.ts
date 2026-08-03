"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { getDashboardSummary } from "../http/get-dashboard-summary";
import type { ActionResult, DashboardSummary } from "../types";

export async function getDashboardSummaryAction(): Promise<
  ActionResult<DashboardSummary>
> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const data = await getDashboardSummary(session.accessToken);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Dashboard Summary Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
