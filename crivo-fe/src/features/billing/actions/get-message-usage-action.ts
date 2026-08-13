"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getMessageUsage } from "../http/get-message-usage";
import type { ActionResult, MessageUsage } from "../types";

// Leitura liberada para qualquer papel — o backend não usa @Roles no GET.
export async function getMessageUsageAction(): Promise<
  ActionResult<MessageUsage>
> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getMessageUsage(token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Message Usage Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
