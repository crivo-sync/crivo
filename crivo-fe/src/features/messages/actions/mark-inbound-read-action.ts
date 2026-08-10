"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  patchAllInboundMessagesRead,
  patchInboundMessageRead,
} from "../http/patch-inbound-message-read";
import type { ActionResult, InboundMessage } from "../types";

export async function markInboundReadAction(
  id: string,
): Promise<ActionResult<InboundMessage>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      patchInboundMessageRead(id, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Mensagem marcada como lida.", data: result.data };
  } catch (error) {
    console.error("[Mark Inbound Read Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function markAllInboundReadAction(): Promise<
  ActionResult<{ count: number }>
> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      patchAllInboundMessagesRead(token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return {
      success: true,
      message:
        result.data.count > 0
          ? `${result.data.count} mensagem(ns) marcada(s) como lida(s).`
          : "Nenhuma mensagem pendente.",
      data: result.data,
    };
  } catch (error) {
    console.error("[Mark All Inbound Read Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
