"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { postProcedure } from "../http/post-procedure";
import {
  createProcedureSchema,
  type CreateProcedureSchema,
} from "../schemas/procedure";
import type { ActionResult, Procedure } from "../types";

export async function postProcedureAction(
  input: CreateProcedureSchema,
): Promise<ActionResult<Procedure>> {
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

  const parsed = createProcedureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      postProcedure(parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Procedimento cadastrado.", data: result.data };
  } catch (error) {
    console.error("[Post Procedure Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o procedimento.",
    };
  }
}
