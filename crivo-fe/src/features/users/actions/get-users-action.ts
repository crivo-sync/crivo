"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { getUsers } from "../http/get-users";
import type { ActionResult, User } from "../types";

export async function getUsersAction(): Promise<ActionResult<User[]>> {
  // Diferente de patients/professionals/procedures: aqui até a LEITURA é
  // @Roles(ADMIN) no backend — não existe listagem de usuários para STAFF.
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

  try {
    const data = await getUsers(auth.session.accessToken);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Users Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
