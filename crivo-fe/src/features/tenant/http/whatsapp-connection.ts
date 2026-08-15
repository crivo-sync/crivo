import { api, authHeaders } from "@/config/api";
import type { WhatsAppConnection } from "../types";

export async function getWhatsAppConnection(
  accessToken: string,
): Promise<WhatsAppConnection> {
  return api
    .get("whatsapp-connection", { headers: authHeaders(accessToken) })
    .json<WhatsAppConnection>();
}

/** Inicia (ou refaz) o pareamento e devolve o QR para a clínica ler. */
export async function connectWhatsApp(
  accessToken: string,
): Promise<WhatsAppConnection> {
  return api
    .post("whatsapp-connection", { headers: authHeaders(accessToken) })
    .json<WhatsAppConnection>();
}

export async function disconnectWhatsApp(
  accessToken: string,
): Promise<WhatsAppConnection> {
  return api
    .delete("whatsapp-connection", { headers: authHeaders(accessToken) })
    .json<WhatsAppConnection>();
}
