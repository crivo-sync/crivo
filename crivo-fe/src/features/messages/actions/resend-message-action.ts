"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { postResendMessage } from "../http/post-resend-message";
import type { ActionResult } from "../types";

/**
 * Sem `requireAdmin`: quem trata as falhas é a recepção, e o backend também
 * não usa `@Roles` nesta rota — ADMIN e STAFF têm o mesmo acesso, como no
 * resto do módulo de Mensagens.
 */
export async function resendMessageAction(
  id: string,
): Promise<ActionResult<void>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      postResendMessage(id, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Mensagem reenviada.", data: undefined };
  } catch (error) {
    console.error("[Resend Message Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível reenviar a mensagem.",
    };
  }
}
