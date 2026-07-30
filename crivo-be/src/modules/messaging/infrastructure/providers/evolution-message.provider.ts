import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  MessageProvider,
  SendMessageInput,
  SendMessageResult,
} from '../../domain/provider/message-provider';

type EvolutionResponse = {
  key?: { id?: string };
  message?: unknown;
};

/**
 * Evolution API — camada NÃO oficial sobre o WhatsApp Web.
 *
 * ⚠️ Uso restrito a desenvolvimento e demonstração. A Meta não autoriza esse
 * tipo de conexão e bane o número em definitivo, sem aviso e sem recurso.
 * Em produção o provider é `meta` (Cloud API oficial) — ver ROADMAP.md.
 */
@Injectable()
export class EvolutionMessageProvider implements MessageProvider {
  readonly name = 'evolution';

  private readonly logger = new Logger(EvolutionMessageProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const baseUrl = this.config.getOrThrow<string>('EVOLUTION_API_URL');
    const apiKey = this.config.getOrThrow<string>('EVOLUTION_API_KEY');
    const instance = this.config.getOrThrow<string>('EVOLUTION_INSTANCE');

    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/message/sendText/${instance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: toEvolutionNumber(input.toPhone),
          text: input.body,
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();

      throw new Error(
        `Evolution API respondeu ${response.status}: ${detail.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as EvolutionResponse;

    this.logger.log(`[EVOLUTION] enviada para ${input.toPhone}`);

    return { providerMessageId: payload.key?.id };
  }
}

/** A Evolution espera o número com DDI, apenas dígitos (ex: 5511987650001). */
function toEvolutionNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  return digits.startsWith('55') ? digits : `55${digits}`;
}
