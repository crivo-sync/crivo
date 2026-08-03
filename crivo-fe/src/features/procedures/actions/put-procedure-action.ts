"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { putProcedure } from "../http/put-procedure";
import {
  updateProcedureSchema,
  type UpdateProcedureSchema,
} from "../schemas/procedure";
import type { ActionResult, Procedure } from "../types";

export async function putProcedureAction(
  id: string,
  input: UpdateProcedureSchema,
): Promise<ActionResult<Procedure>> {
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

  const parsed = updateProcedureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const data = await putProcedure(id, parsed.data, auth.session.accessToken);
    return { success: true, message: "Procedimento atualizado.", data };
  } catch (error) {
    console.error("[Put Procedure Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o procedimento.",
    };
  }
}
