"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { postUser } from "../http/post-user";
import { createUserSchema, type CreateUserSchema } from "../schemas/user";
import type { ActionResult, User } from "../types";

export async function postUserAction(
  input: CreateUserSchema,
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

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      postUser(parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Usuário cadastrado.", data: result.data };
  } catch (error) {
    console.error("[Post User Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o usuário.",
    };
  }
}
