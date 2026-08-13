"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getConversation } from "../http/get-conversation";
import { postManualMessage } from "../http/post-manual-message";
import type { ActionResult, ConversationEntry } from "../types";

// Sem `requireAdmin`: responder ao paciente é trabalho da recepção (STAFF),
// mesma decisão já tomada na caixa de entrada.
export async function getConversationAction(
  patientId: string,
): Promise<ActionResult<ConversationEntry[]>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getConversation(patientId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Conversation Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function sendManualMessageAction(
  patientId: string,
  body: string,
): Promise<ActionResult<undefined>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      postManualMessage(patientId, body, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return {
      success: true,
      // "Na fila" e não "enviada": o envio é assíncrono e pode falhar depois.
      // Prometer entrega aqui seria a mesma mentira que a lista de falhas
      // existe para desfazer.
      message: "Mensagem na fila de envio.",
      data: undefined,
    };
  } catch (error) {
    console.error("[Send Manual Message Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
