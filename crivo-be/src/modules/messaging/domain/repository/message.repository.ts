import {
  Message,
  MessageChannel,
  MessageStatus,
  MessageType,
} from '@prisma/client';

export type CreateMessageData = {
  tenantId: string;
  appointmentId?: string | null;
  patientId?: string | null;
  channel?: MessageChannel;
  type: MessageType;
  toPhone: string;
  body: string;
  scheduledFor?: Date | null;
};

export type MarkSentData = {
  provider: string;
  providerMessageId?: string;
};

export type FindManyMessagesParams = {
  tenantId: string;
  status?: MessageStatus;
  from?: Date;
  to?: Date;
  page: number;
  perPage: number;
};

export type MessageWithPatient = Message & {
  appointment: {
    id: string;
    startsAt: Date;
    patient: { id: string; name: string; phone: string };
  } | null;
  /** Direto, para mensagens sem `appointmentId` (ex.: `MANUAL`). */
  patient: { id: string; name: string; phone: string } | null;
};

export type PaginatedMessages = {
  data: MessageWithPatient[];
  total: number;
};

export const MESSAGE_REPOSITORY = 'MessageRepository';

export type MessageRepository = {
  create(data: CreateMessageData): Promise<Message>;
  /** Traz o paciente junto: o worker precisa dele para logar de quem é a falha. */
  findById(id: string): Promise<MessageWithPatient | null>;
  findMany(params: FindManyMessagesParams): Promise<PaginatedMessages>;
  /** Todo envio a um paciente, mais antigo primeiro — metade da timeline da conversa. */
  findByPatient(tenantId: string, patientId: string): Promise<Message[]>;
  markSent(id: string, data: MarkSentData): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
  /**
   * Devolve uma mensagem FAILED para PENDING, para o reenvio manual da
   * recepção. Zera `attempts` porque a fila reconta as tentativas do job
   * novo — manter o contador antigo faria o retry parar antes da hora.
   */
  resetForRetry(id: string): Promise<void>;
  /** Total de mensagens enviadas no período — base da franquia de cobrança. */
  countSentInPeriod(tenantId: string, from: Date, to: Date): Promise<number>;
};
