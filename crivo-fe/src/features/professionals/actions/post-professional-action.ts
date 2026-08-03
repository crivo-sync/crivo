"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { postProfessional } from "../http/post-professional";
import {
  createProfessionalSchema,
  type CreateProfessionalSchema,
} from "../schemas/professional";
import type { ActionResult, Professional } from "../types";

export async function postProfessionalAction(
  input: CreateProfessionalSchema,
): Promise<ActionResult<Professional>> {
  // Backend exige @Roles(ADMIN) — falhamos antes com mensagem clara.
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

  const parsed = createProfessionalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const data = await postProfessional(parsed.data, auth.session.accessToken);
    return { success: true, message: "Profissional cadastrado.", data };
  } catch (error) {
    console.error("[Post Professional Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o profissional.",
    };
  }
}
