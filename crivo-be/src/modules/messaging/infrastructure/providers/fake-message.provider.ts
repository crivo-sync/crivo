import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import {
  MessageProvider,
  SendMessageInput,
  SendMessageResult,
} from '../../domain/provider/message-provider';

/**
 * Provider de desenvolvimento: não envia nada, apenas loga. Permite exercitar
 * fila, retry, confirmação e fallback sem depender de WhatsApp nem de infra
 * externa. A mensagem fica registrada na tabela `messages` como qualquer outra.
 *
 * Para testar o caminho de falha, use um telefone terminado em `0000`.
 */
@Injectable()
export class FakeMessageProvider implements MessageProvider {
  readonly name = 'fake';

  private readonly logger = new Logger(FakeMessageProvider.name);

  send(input: SendMessageInput): Promise<SendMessageResult> {
    if (input.toPhone.endsWith('0000')) {
      return Promise.reject(
        new Error(
          'Falha simulada de envio (telefone de teste terminado em 0000)',
        ),
      );
    }

    this.logger.log(`[FAKE] → ${input.toPhone}\n${input.body}`);

    return Promise.resolve({ providerMessageId: `fake_${randomUUID()}` });
  }
}
