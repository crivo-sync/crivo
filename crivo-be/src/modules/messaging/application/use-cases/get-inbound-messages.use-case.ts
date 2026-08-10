import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReplyIntent } from '@prisma/client';

import {
  INBOUND_MESSAGE_REPOSITORY,
  type InboundMessageRepository,
} from '../../domain/repository/inbound-message.repository';

export type GetInboundMessagesInput = {
  tenantId: string;
  unreadOnly?: boolean;
  intent?: ReplyIntent;
  page: number;
  perPage: number;
};

/**
 * Caixa de entrada da recepção.
 *
 * O webhook já gravava tudo que o paciente respondia, mas ninguém lia: um
 * "posso levar minha filha?" ficava no banco sem nunca chegar a um humano.
 * As confirmações automáticas já nascem lidas, então o que sobra aqui é
 * exatamente o que precisa de alguém.
 */
@Injectable()
export class GetInboundMessagesUseCase {
  constructor(
    @Inject(INBOUND_MESSAGE_REPOSITORY)
    private readonly repository: InboundMessageRepository,
  ) {}

  execute(input: GetInboundMessagesInput) {
    return this.repository.findMany(input);
  }

  async markAsRead(id: string, tenantId: string) {
    const message = await this.repository.markAsRead(id, tenantId);

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada.');
    }

    return message;
  }

  markAllAsRead(tenantId: string) {
    return this.repository.markAllAsRead(tenantId);
  }
}
