"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { postPatient } from "../http/post-patient";
import { createPatientSchema, type CreatePatientSchema } from "../schemas/patient";
import type { ActionResult, Patient } from "../types";

export async function postPatientAction(
  input: CreatePatientSchema,
): Promise<ActionResult<Patient>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = createPatientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(session.accessToken, (token) =>
      postPatient(parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Paciente cadastrado.", data: result.data };
  } catch (error) {
    // `beforeError` em config/api.ts já substituiu a mensagem crua do ky
    // pela mensagem que o crivo-be devolveu no corpo.
    console.error("[Post Patient Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o paciente.",
    };
  }
}
