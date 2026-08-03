"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getMessages } from "../http/get-messages";
import type { MessagesQueryParams } from "../schemas/messages-query-params";
import type { ActionResult, Message, PaginatedResponse } from "../types";

export async function getMessagesAction(
  params: MessagesQueryParams,
): Promise<ActionResult<PaginatedResponse<Message>>> {
  // Leitura liberada para qualquer papel — o backend não usa @Roles no GET.
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getMessages(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Messages Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
