"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { deletePatient } from "../http/delete-patient";
import type { ActionResult } from "../types";

export async function deletePatientAction(id: string): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    await deletePatient(id, session.accessToken);
    return { success: true, message: "Paciente removido.", data: undefined };
  } catch (error) {
    console.error("[Delete Patient Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível remover o paciente.",
    };
  }
}
