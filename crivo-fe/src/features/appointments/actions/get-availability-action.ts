"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  getAvailability,
  type GetAvailabilityParams,
} from "../http/get-availability";
import type { ActionResult, Availability } from "../types";

export async function getAvailabilityAction(
  params: GetAvailabilityParams,
): Promise<ActionResult<Availability>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getAvailability(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Availability Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os horários livres.",
    };
  }
}
