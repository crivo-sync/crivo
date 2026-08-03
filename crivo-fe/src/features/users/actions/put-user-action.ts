"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { putUser } from "../http/put-user";
import { updateUserSchema, type UpdateUserSchema } from "../schemas/user";
import type { ActionResult, User } from "../types";

export async function putUserAction(
  id: string,
  input: UpdateUserSchema,
): Promise<ActionResult<User>> {
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

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const data = await putUser(id, parsed.data, auth.session.accessToken);
    return { success: true, message: "Usuário atualizado.", data };
  } catch (error) {
    console.error("[Put User Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário.",
    };
  }
}
