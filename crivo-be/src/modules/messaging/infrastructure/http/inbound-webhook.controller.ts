import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';

import { ReceiveInboundMessageUseCase } from '../../application/use-cases/receive-inbound-message.use-case';
import { extractInboundMessage } from '../dtos/evolution-webhook.dto';
import type { EvolutionWebhookDto } from '../dtos/evolution-webhook.dto';

/**
 * Recebe as mensagens que o paciente manda de volta.
 *
 * **Rota pública com segredo no caminho.** O provider não faz login: quem
 * autentica a chamada é o token da URL, comparado em tempo constante. Sem
 * `INBOUND_WEBHOOK_TOKEN` configurado o endpoint recusa tudo — um webhook
 * aberto aceitaria qualquer um injetando mensagem no nome de um paciente.
 *
 * O `tenantId` vem no caminho porque a Evolution é uma instância por clínica
 * e o payload dela não carrega essa informação: não há como derivar o tenant
 * do conteúdo, e adivinhar pelo telefone destino misturaria clínicas que
 * usem o mesmo número.
 */
@ApiExcludeController()
@Controller('webhooks/inbound')
export class InboundWebhookController {
  private readonly logger = new Logger(InboundWebhookController.name);

  constructor(
    private readonly receiveInbound: ReceiveInboundMessageUseCase,
    private readonly config: ConfigService,
  ) {}

  @Post(':tenantId/:token')
  // 200 sempre que o evento for aceito: o WhatsApp reentrega o webhook
  // quando não recebe sucesso, e reentregar não conserta payload que já
  // ignoramos de propósito.
  @HttpCode(200)
  async receive(
    @Param('tenantId') tenantId: string,
    @Param('token') token: string,
    @Body() payload: EvolutionWebhookDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    this.assertToken(token);

    const message = extractInboundMessage(payload);

    if (!message) {
      // Evento que não é mensagem de entrada (status de conexão, recibo de
      // leitura, mensagem que nós mesmos enviamos). Não é erro.
      this.logger.debug(
        `Evento ignorado: ${payload.event ?? 'sem evento'} (${userAgent ?? '—'})`,
      );
      return { ignored: true };
    }

    const result = await this.receiveInbound.execute({
      tenantId,
      fromPhone: message.fromPhone,
      body: message.body,
      provider: 'evolution',
      providerMessageId: message.providerMessageId,
      sentAt: message.sentAt,
    });

    return {
      stored: result.stored,
      intent: result.intent,
      confirmed: result.confirmed,
    };
  }

  private assertToken(token: string): void {
    const expected = this.config.get<string>('INBOUND_WEBHOOK_TOKEN');

    if (!expected) {
      this.logger.error(
        'INBOUND_WEBHOOK_TOKEN não configurado — webhook recusado.',
      );
      throw new BadRequestException('Webhook não configurado.');
    }

    const provided = Buffer.from(token);
    const secret = Buffer.from(expected);

    // `timingSafeEqual` exige mesmo tamanho, e o próprio tamanho não é
    // segredo — comparar antes evita a exceção sem vazar nada útil.
    if (
      provided.length !== secret.length ||
      !timingSafeEqual(provided, secret)
    ) {
      throw new UnauthorizedException('Token inválido.');
    }
  }
}
