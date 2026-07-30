import { Inject, Injectable } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';

import {
  MESSAGE_REPOSITORY,
  type MessageRepository,
} from '../../domain/repository/message.repository';

export type GetMessagesInput = {
  tenantId: string;
  status?: MessageStatus;
  from?: Date;
  to?: Date;
  page: number;
  perPage: number;
};

@Injectable()
export class GetMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
  ) {}

  execute(input: GetMessagesInput) {
    return this.messageRepository.findMany(input);
  }

  /**
   * Fallback da recepção: quem não recebeu a mensagem e precisa de ligação.
   * É a resposta direta ao cenário "o WhatsApp caiu e ninguém percebeu".
   */
  getFailed(tenantId: string, page: number, perPage: number) {
    return this.messageRepository.findMany({
      tenantId,
      status: MessageStatus.FAILED,
      page,
      perPage,
    });
  }
}
