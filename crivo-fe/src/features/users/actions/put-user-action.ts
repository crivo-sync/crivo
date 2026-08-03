"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
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
    const result = await withAuth(auth.session.accessToken, (token) =>
      putUser(id, parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Usuário atualizado.", data: result.data };
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
