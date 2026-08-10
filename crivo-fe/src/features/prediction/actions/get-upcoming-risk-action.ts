"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getUpcomingRisk } from "../http/get-upcoming-risk";
import type { ActionResult, UpcomingRiskResponse } from "../types";

export async function getUpcomingRiskAction(params: {
  days: number;
  limit: number;
}): Promise<ActionResult<UpcomingRiskResponse>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getUpcomingRisk(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Upcoming Risk Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
