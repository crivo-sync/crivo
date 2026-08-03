"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { deleteProfessional } from "../http/delete-professional";
import type { ActionResult } from "../types";

export async function deleteProfessionalAction(
  id: string,
): Promise<ActionResult> {
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
    await deleteProfessional(id, auth.session.accessToken);
    return { success: true, message: "Profissional removido.", data: undefined };
  } catch (error) {
    console.error("[Delete Professional Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível remover o profissional.",
    };
  }
}
