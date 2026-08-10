"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  getInboundMessages,
  type GetInboundMessagesParams,
} from "../http/get-inbound-messages";
import type { ActionResult, InboundMessagesResponse } from "../types";

export async function getInboundMessagesAction(
  params: GetInboundMessagesParams,
): Promise<ActionResult<InboundMessagesResponse>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getInboundMessages(params, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Inbound Messages Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
