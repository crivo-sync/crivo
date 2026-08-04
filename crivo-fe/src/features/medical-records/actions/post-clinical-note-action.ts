"use server";

import {
  FORBIDDEN_MESSAGE,
  requireClinical,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { postClinicalNote } from "../http/post-clinical-note";
import {
  clinicalNoteFormSchema,
  type ClinicalNoteFormSchema,
} from "../schemas/medical-record";
import type { ActionResult, ClinicalNote } from "../types";

export async function postClinicalNoteAction(
  patientId: string,
  input: ClinicalNoteFormSchema,
): Promise<ActionResult<ClinicalNote>> {
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

  const parsed = clinicalNoteFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      postClinicalNote(patientId, parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Evolução registrada.", data: result.data };
  } catch (error) {
    console.error("[Post Clinical Note Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a evolução.",
    };
  }
}
