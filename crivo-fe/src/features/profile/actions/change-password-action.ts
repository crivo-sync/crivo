"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { putPassword } from "../http/put-password";
import type { ActionResult } from "../types";

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      putPassword(input, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Senha atualizada.", data: undefined };
  } catch (error) {
    console.error("[Change Password Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível trocar a senha.",
    };
  }
}
