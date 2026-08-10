"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  getMessageTemplates,
  putMessageTemplate,
} from "../http/message-templates";
import type { ActionResult } from "../types";
import type {
  MessageTemplate,
  MessageTemplatesResponse,
  SaveTemplateInput,
} from "../types/templates";

export async function getMessageTemplatesAction(): Promise<
  ActionResult<MessageTemplatesResponse>
> {
  // Leitura também é ADMIN: o backend usa `@Roles(ADMIN)` na classe inteira,
  // então pedir com STAFF só devolveria 403.
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
    const result = await withAuth(auth.session.accessToken, (token) =>
      getMessageTemplates(token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Message Templates Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function putMessageTemplateAction(
  input: SaveTemplateInput,
): Promise<ActionResult<MessageTemplate>> {
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
    const result = await withAuth(auth.session.accessToken, (token) =>
      putMessageTemplate(input, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return {
      success: true,
      message: "Texto da mensagem salvo.",
      data: result.data,
    };
  } catch (error) {
    console.error("[Put Message Template Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
