import {
  Message,
  MessageChannel,
  MessageStatus,
  MessageType,
} from '@prisma/client';

export type CreateMessageData = {
  tenantId: string;
  appointmentId?: string | null;
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
};

export type PaginatedMessages = {
  data: MessageWithPatient[];
  total: number;
};

export const MESSAGE_REPOSITORY = 'MessageRepository';

export type MessageRepository = {
  create(data: CreateMessageData): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findMany(params: FindManyMessagesParams): Promise<PaginatedMessages>;
  markSent(id: string, data: MarkSentData): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
  /** Total de mensagens enviadas no período — base da franquia de cobrança. */
  countSentInPeriod(tenantId: string, from: Date, to: Date): Promise<number>;
};
