"use server";

import {
  FORBIDDEN_MESSAGE,
  requireClinical,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getAnamnesis } from "../http/get-anamnesis";
import type { ActionResult, Anamnesis } from "../types";

export async function getAnamnesisAction(
  patientId: string,
): Promise<ActionResult<Anamnesis | null>> {
  // Prontuário é dado sensível: a recepção não passa daqui.
  const auth = await requireClinical();
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
      getAnamnesis(patientId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Anamnesis Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
