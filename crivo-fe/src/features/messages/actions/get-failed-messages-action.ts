"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { getFailedMessages } from "../http/get-failed-messages";
import type { ActionResult, Message, PaginatedResponse } from "../types";

export async function getFailedMessagesAction(params: {
  page: number;
  perPage: number;
}): Promise<ActionResult<PaginatedResponse<Message>>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const data = await getFailedMessages(params, session.accessToken);
    return { success: true, message: "Sucesso", data };
  } catch (error) {
    console.error("[Get Failed Messages Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
