"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { deleteProcedure } from "../http/delete-procedure";
import type { ActionResult } from "../types";

export async function deleteProcedureAction(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return {
      success: false,
      message:
        auth.reason === "forbidden"
          ? FORBIDDEN_MESSAGE
          : SESSION_EXPIRED_MESSAGE,
    };
  }

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      deleteProcedure(id, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Procedimento removido.", data: undefined };
  } catch (error) {
    console.error("[Delete Procedure Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível remover o procedimento.",
    };
  }
}
