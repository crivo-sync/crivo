"use server";

import {
  FORBIDDEN_MESSAGE,
  requireClinical,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getClinicalNotes } from "../http/get-clinical-notes";
import type { ActionResult, ClinicalNote, PaginatedResponse } from "../types";

export async function getClinicalNotesAction(
  patientId: string,
  params: { page: number; perPage: number },
): Promise<ActionResult<PaginatedResponse<ClinicalNote>>> {
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
      getClinicalNotes(patientId, params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Clinical Notes Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
