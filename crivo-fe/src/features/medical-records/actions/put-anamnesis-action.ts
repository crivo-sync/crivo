"use server";

import {
  FORBIDDEN_MESSAGE,
  requireClinical,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { putAnamnesis } from "../http/put-anamnesis";
import {
  anamnesisFormSchema,
  type AnamnesisFormSchema,
} from "../schemas/medical-record";
import type { ActionResult, Anamnesis } from "../types";

export async function putAnamnesisAction(
  patientId: string,
  input: AnamnesisFormSchema,
): Promise<ActionResult<Anamnesis>> {
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

  const parsed = anamnesisFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      putAnamnesis(patientId, parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Ficha salva.", data: result.data };
  } catch (error) {
    console.error("[Put Anamnesis Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a ficha.",
    };
  }
}
