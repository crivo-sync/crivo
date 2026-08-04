"use server";

import { postConfirmation } from "../http/post-confirmation";
import type { ActionResult, ConfirmationResult } from "../types";

/**
 * Roda no servidor do crivo-fe, que chama o crivo-be por rede interna —
 * o celular do paciente nunca precisa alcançar o crivo-be diretamente,
 * só o crivo-fe (mesmo domínio da página que ele já abriu).
 */
export async function confirmAppointmentAction(
  token: string,
): Promise<ActionResult<ConfirmationResult>> {
  try {
    const data = await postConfirmation(token);
    return { success: true, message: "Presença confirmada.", data };
  } catch (error) {
    console.error("[Confirm Appointment Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar. Tente novamente.",
    };
  }
}
