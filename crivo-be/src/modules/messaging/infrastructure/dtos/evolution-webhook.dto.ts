/**
 * Payload do webhook da Evolution API (v2).
 *
 * Tudo é opcional de propósito: é entrada de rede de um sistema que não
 * controlamos, e o mesmo endpoint recebe dezenas de tipos de evento
 * (conexão, recibo de leitura, presença). Exigir campo transformaria evento
 * irrelevante em erro 400, e o WhatsApp reentrega o que não devolve 200 —
 * um payload inesperado viraria retry em looping.
 */
export type EvolutionWebhookDto = {
  /** `MESSAGES_UPSERT` para mensagem recebida. */
  event?: string;
  instance?: string;
  data?: {
    key?: {
      /** `5511987654321@s.whatsapp.net` (ou `@g.us` em grupo). */
      remoteJid?: string;
      /** `true` quando fomos nós que enviamos — não é mensagem do paciente. */
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
    };
    messageType?: string;
    /** Unix epoch em **segundos**. */
    messageTimestamp?: number;
  };
};

export type InboundMessageData = {
  fromPhone: string;
  body: string;
  providerMessageId?: string;
  sentAt: Date;
};

const MESSAGE_EVENT = 'MESSAGES_UPSERT';

/**
 * Extrai a mensagem do paciente, ou `null` quando o evento não é uma.
 *
 * Descarta de propósito:
 * - eventos que não são `MESSAGES_UPSERT` (conexão, presença, recibo);
 * - `fromMe: true` — é o lembrete que nós mesmos mandamos voltando pelo
 *   webhook; gravar isso duplicaria a mensagem de saída como se fosse
 *   resposta do paciente;
 * - grupos (`@g.us`) — a clínica conversa 1:1, e um grupo não identifica
 *   paciente;
 * - mídia sem legenda (áudio, imagem), que chega sem texto algum. Fica
 *   registrado como limitação conhecida: hoje o Crivo só lê texto.
 */
export function extractInboundMessage(
  payload: EvolutionWebhookDto,
): InboundMessageData | null {
  if (payload.event?.toUpperCase() !== MESSAGE_EVENT) return null;

  const data = payload.data;
  const remoteJid = data?.key?.remoteJid;

  if (!data || !remoteJid || data.key?.fromMe) return null;
  if (remoteJid.endsWith('@g.us')) return null;

  const body =
    data.message?.conversation ?? data.message?.extendedTextMessage?.text;

  if (!body?.trim()) return null;

  return {
    fromPhone: remoteJid.split('@')[0],
    body: body.trim(),
    providerMessageId: data.key?.id,
    // O provider manda em segundos; `Date` espera milissegundos. Sem o
    // fallback, um evento sem timestamp viraria 1970.
    sentAt: data.messageTimestamp
      ? new Date(data.messageTimestamp * 1000)
      : new Date(),
  };
}
