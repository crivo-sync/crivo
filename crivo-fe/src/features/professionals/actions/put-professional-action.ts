"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { putProfessional } from "../http/put-professional";
import {
  updateProfessionalSchema,
  type UpdateProfessionalSchema,
} from "../schemas/professional";
import type { ActionResult, Professional } from "../types";

export async function putProfessionalAction(
  id: string,
  input: UpdateProfessionalSchema,
): Promise<ActionResult<Professional>> {
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

  const parsed = updateProfessionalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const data = await putProfessional(
      id,
      parsed.data,
      auth.session.accessToken,
    );
    return { success: true, message: "Profissional atualizado.", data };
  } catch (error) {
    console.error("[Put Professional Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o profissional.",
    };
  }
}
