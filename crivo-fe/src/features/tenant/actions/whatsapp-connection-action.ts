"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppConnection,
} from "../http/whatsapp-connection";
import type { ActionResult, WhatsAppConnection } from "../types";

/**
 * As três ações exigem ADMIN, inclusive a leitura — igual ao backend.
 *
 * Diferente da maioria das telas (onde STAFF lê e não escreve): aqui o
 * estado revela por qual número a clínica fala com os pacientes, e
 * desconectar interrompe todo lembrete. Não é decisão da recepção.
 */
async function withAdmin<T>(
  operation: (token: string) => Promise<T>,
  errorLabel: string,
  successMessage: string,
): Promise<ActionResult<T>> {
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
    const result = await withAuth(auth.session.accessToken, operation);
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: successMessage, data: result.data };
  } catch (error) {
    console.error(`[${errorLabel}]`, error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível falar com o servidor de WhatsApp.",
    };
  }
}

export async function getWhatsAppConnectionAction(): Promise<
  ActionResult<WhatsAppConnection>
> {
  return withAdmin(
    (token) => getWhatsAppConnection(token),
    "Get WhatsApp Connection Action Error",
    "Sucesso",
  );
}

export async function connectWhatsAppAction(): Promise<
  ActionResult<WhatsAppConnection>
> {
  return withAdmin(
    (token) => connectWhatsApp(token),
    "Connect WhatsApp Action Error",
    "Leia o QR code no seu WhatsApp.",
  );
}

export async function disconnectWhatsAppAction(): Promise<
  ActionResult<WhatsAppConnection>
> {
  return withAdmin(
    (token) => disconnectWhatsApp(token),
    "Disconnect WhatsApp Action Error",
    "WhatsApp desconectado.",
  );
}
