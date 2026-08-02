"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { putPatient } from "../http/put-patient";
import { updatePatientSchema, type UpdatePatientSchema } from "../schemas/patient";
import type { ActionResult, Patient } from "../types";

export async function putPatientAction(
  id: string,
  input: UpdatePatientSchema,
): Promise<ActionResult<Patient>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = updatePatientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const data = await putPatient(id, parsed.data, session.accessToken);
    return { success: true, message: "Paciente atualizado.", data };
  } catch (error) {
    console.error("[Put Patient Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o paciente.",
    };
  }
}
