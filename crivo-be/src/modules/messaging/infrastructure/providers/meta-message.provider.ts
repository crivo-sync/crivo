import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  MessageProvider,
  SendMessageInput,
  SendMessageResult,
} from '../../domain/provider/message-provider';

type MetaResponse = {
  messages?: { id?: string }[];
  error?: { message?: string };
};

/**
 * WhatsApp Cloud API oficial — o provider de produção.
 *
 * Custa por conversa, mas é o único caminho que não corre risco de banimento.
 * Ver "A dor que valida o produto" no ROADMAP.md.
 *
 * ⚠️ Mensagem fora da janela de 24h exige template aprovado pela Meta. Este
 * provider envia texto livre, que só funciona dentro da janela — o envio por
 * template entra junto com o cadastro de templates por clínica.
 */
@Injectable()
export class MetaMessageProvider implements MessageProvider {
  readonly name = 'meta';

  private readonly logger = new Logger(MetaMessageProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const token = this.config.getOrThrow<string>('META_WHATSAPP_TOKEN');
    const phoneNumberId = this.config.getOrThrow<string>(
      'META_WHATSAPP_PHONE_NUMBER_ID',
    );
    const version = this.config.get<string>('META_API_VERSION') ?? 'v21.0';

    const response = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: toE164(input.toPhone),
          type: 'text',
          text: { preview_url: false, body: input.body },
        }),
      },
    );

    const payload = (await response.json()) as MetaResponse;

    if (!response.ok) {
      throw new Error(
        `Meta Cloud API respondeu ${response.status}: ${
          payload.error?.message ?? 'erro desconhecido'
        }`,
      );
    }

    this.logger.log(`[META] enviada para ${input.toPhone}`);

    return { providerMessageId: payload.messages?.[0]?.id };
  }
}

/** A Meta exige E.164 sem o `+` (ex: 5511987650001). */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  return digits.startsWith('55') ? digits : `55${digits}`;
}
