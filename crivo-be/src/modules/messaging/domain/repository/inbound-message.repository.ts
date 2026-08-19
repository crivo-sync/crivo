import { InboundMessage, ReplyIntent } from '@prisma/client';

export type FindManyInboundParams = {
  tenantId: string;
  /** `true` = só não lidas; `false` = só lidas; ausente = todas. */
  unreadOnly?: boolean;
  intent?: ReplyIntent;
  page: number;
  perPage: number;
};

export type InboundMessageWithRelations = InboundMessage & {
  patient: { id: string; name: string; phone: string } | null;
  appointment: { id: string; startsAt: Date } | null;
};

export type PaginatedInboundMessages = {
  data: InboundMessageWithRelations[];
  total: number;
  /** Não lidas no tenant inteiro, não só na página — alimenta o badge. */
  unreadTotal: number;
  /**
   * Pedidos de cancelamento (`intent: CANCEL`) ainda não lidos, no tenant
   * inteiro. Separado de `unreadTotal` porque é o número que acende o
   * alerta na sidebar — "alguém quer cancelar" pesa mais que "alguém
   * perguntou um horário", e o badge genérico não distinguia os dois.
   */
  unreadCancelTotal: number;
};

export const INBOUND_MESSAGE_REPOSITORY = 'InboundMessageRepository';

export interface InboundMessageRepository {
  findMany(params: FindManyInboundParams): Promise<PaginatedInboundMessages>;

  /** Devolve `null` quando a mensagem não é do tenant informado. */
  markAsRead(id: string, tenantId: string): Promise<InboundMessage | null>;

  markAllAsRead(tenantId: string): Promise<number>;

  /** Todo recebido de um paciente, mais antigo primeiro — a outra metade da timeline da conversa. */
  findByPatient(tenantId: string, patientId: string): Promise<InboundMessage[]>;
}
