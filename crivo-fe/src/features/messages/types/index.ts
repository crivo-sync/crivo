export type MessageChannel = "WHATSAPP" | "SMS";

export type MessageType =
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CONFIRMATION_RECEIPT"
  | "WAITLIST_OFFER"
  | "MANUAL";

export type MessageStatus =
  | "PENDING"
  | "CANCELLED"
  | "SENT"
  | "DELIVERED"
  | "FAILED";

export type Message = {
  id: string;
  channel: MessageChannel;
  type: MessageType;
  status: MessageStatus;
  toPhone: string;
  body: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  failedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  appointment: {
    id: string;
    startsAt: string;
    patient: { id: string; name: string; phone: string };
  } | null;
};

/** O que o backend entendeu da resposta do paciente. */
export type ReplyIntent = "CONFIRM" | "CANCEL" | "UNKNOWN";

/** Mensagem que o paciente enviou para a clínica. */
export type InboundMessage = {
  id: string;
  channel: "WHATSAPP";
  fromPhone: string;
  body: string;
  intent: ReplyIntent;
  sentAt: string;
  readAt: string | null;
  /** Nulo quando o número não bate com nenhum cadastro. */
  patient: { id: string; name: string; phone: string } | null;
  appointment: { id: string; startsAt: string } | null;
};

/**
 * A listagem de recebidas traz `unreadTotal` além da paginação: é a contagem
 * do tenant inteiro (não da página nem do filtro), usada no badge do menu.
 */
export type InboundMessagesResponse = PaginatedResponse<InboundMessage> & {
  unreadTotal: number;
};

/**
 * Uma linha da conversa com o paciente — envio e recebimento achatados no
 * mesmo formato pelo backend, para a tela renderizar bolhas sem checar de
 * qual tabela cada uma veio.
 *
 * Os campos que não existem na outra ponta vêm nulos: `status`/`type` só em
 * `OUT` (recebida não tem fila nem tentativa), `intent` só em `IN`.
 */
export type ConversationEntry = {
  id: string;
  direction: "OUT" | "IN";
  body: string;
  at: string;
  type: MessageType | null;
  status: MessageStatus | null;
  lastError: string | null;
  intent: ReplyIntent | null;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ActionResult<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; data?: undefined };
