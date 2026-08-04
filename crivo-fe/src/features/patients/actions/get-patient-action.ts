"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getPatient } from "../http/get-patient";
import type { ActionResult, Patient } from "../types";

/**
 * Detalhe de um paciente. Leitura liberada para qualquer papel — o cadastro
 * é dado comum e a recepção precisa dele. O que a recepção não vê é o
 * prontuário, protegido separadamente em `features/medical-records`.
 */
export async function getPatientAction(
  id: string,
): Promise<ActionResult<Patient>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getPatient(id, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Patient Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
