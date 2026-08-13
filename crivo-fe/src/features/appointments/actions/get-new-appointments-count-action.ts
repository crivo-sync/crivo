"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getNewAppointmentsCount } from "../http/get-new-appointments-count";
import type { ActionResult } from "../types";

// Backend não usa @Roles em appointments — ADMIN e STAFF agendam igual.
export async function getNewAppointmentsCountAction(
  since: string,
): Promise<ActionResult<{ count: number }>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getNewAppointmentsCount(since, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get New Appointments Count Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
